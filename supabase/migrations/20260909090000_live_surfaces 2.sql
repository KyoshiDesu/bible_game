-- Phase 6 — the live surfaces.
--
-- Phase 5 built the room engine and proved it against a real database with
-- nothing rendering it. This migration adds the three things a projector and a
-- roomful of phones need on top of that engine, and nothing else:
--
--   1. State transitions on the wire, by putting the run tables in the
--      realtime publication.
--   2. Live vote counts on the wire, broadcast by the database rather than
--      reported by any client.
--   3. One RPC to start a meeting, because a meeting and its first run have to
--      appear together or not at all.
--
-- The two channels are deliberately different in reliability. Transitions are
-- derived from committed rows, so a client that drops and refetches gets the
-- identical answer and no replay log is needed anywhere. Counts are an
-- aggregate on a best-effort channel: "seven of twelve have voted" being half a
-- second stale costs nothing, and losing it entirely costs a number on a
-- screen, not the state of the meeting.

-- ------------------------------------------------------------------- the tie
--
-- A tie writes no `beat_results` row — the beat is not resolved until the
-- leader resolves it — so until phase 6 there was nowhere for "which options
-- tied" to live, and the projector could only say that the room was split.
--
-- Putting it on the run row means it reaches every screen down the same
-- channel as the state that caused it, so a phone and the projector cannot
-- disagree about what the tie was. It is cleared on every transition out of
-- `tied`, so a stale tie can never be rendered next to a state that has moved.

alter table public.scenario_runs
  add column tie jsonb
    constraint scenario_runs_tie_shape check (
      tie is null or (tie ? 'tied' and tie ? 'tally')
    );

comment on column public.scenario_runs.tie is
  'While state = tied: {"tied": [choice keys], "tally": {...}}. Null otherwise. Written only by close_vote.';

-- ------------------------------------------------- transitions, on the wire
--
-- A change notification is a nudge to refetch, never the new state itself:
-- every screen re-reads the run and its results and renders from scratch. That
-- is what makes a dropped message survivable, and it is why these tables are
-- published while `votes` deliberately is not — a vote row on the wire would
-- carry one person's choice to everyone listening.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'scenario_runs'
  ) then
    alter publication supabase_realtime add table public.scenario_runs;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'beat_results'
  ) then
    alter publication supabase_realtime add table public.beat_results;
  end if;
end;
$$;

-- ------------------------------------------------------ counts, on the wire

/**
 * The run a realtime topic names, or null if the topic is not one of ours.
 *
 * Two topic shapes, both `<prefix><run id>`. Anything else — a topic from a
 * feature that does not exist yet, a string a client made up — returns null,
 * and the policies below then ask about membership of a null group and refuse.
 */
create or replace function private.topic_run_id(p_topic text, p_prefix text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_topic is null or left(p_topic, length(p_prefix)) <> p_prefix then
    return null;
  end if;
  begin
    v_id := substring(p_topic from length(p_prefix) + 1)::uuid;
  exception when others then
    return null;
  end;
  return v_id;
end;
$$;

/*
 * Who may hear a room, and who may say anything in it.
 *
 * `realtime.messages` has row-level security on and no policies, so private
 * channels are closed until something opens one. Two topics are opened here,
 * and the split between them is the point.
 *
 * `room:<run>` is readable and not writable. Counts are written by the trigger
 * below, which runs as the table's owner; no client has an insert policy, so a
 * participant cannot put a number on the projector even if they try. That is
 * what makes "counts are broadcast by the server" a property of the database
 * rather than a convention in the front end.
 *
 * `presence:<run>` is readable and writable by the same members, because
 * Realtime authorises presence as a write — announcing that you are here is
 * saying something. It carries presence and nothing else: no code subscribes
 * to broadcast events on it, so the ability to write there buys a member the
 * ability to be counted as present, which they already are.
 */
create policy room_counts_read on realtime.messages
  for select to authenticated
  using (
    extension = 'broadcast'
    and private.is_member(
      private.run_group(private.topic_run_id(realtime.topic(), 'room:'))
    )
  );

create policy room_presence_read on realtime.messages
  for select to authenticated
  using (
    private.is_member(
      private.run_group(private.topic_run_id(realtime.topic(), 'presence:'))
    )
  );

create policy room_presence_write on realtime.messages
  for insert to authenticated
  with check (
    private.is_member(
      private.run_group(private.topic_run_id(realtime.topic(), 'presence:'))
    )
  );

/**
 * Announcing how many people have voted.
 *
 * The payload is a count and a beat index. It is not a tally: showing the split
 * while voting is open would tell a room what it is expected to think, and the
 * whole point of the mechanic is that people commit before they see where
 * everyone else went. The split appears once, at the reveal, from
 * `beat_results`.
 *
 * A failure here is swallowed on purpose. This is the best-effort channel, and
 * a broadcast that cannot be delivered must never be able to fail the
 * transaction that cast the vote — losing a number on a screen is a smaller
 * problem than losing somebody's vote.
 */
create or replace function private.announce_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_voted integer;
  v_members integer;
begin
  select count(*) into v_voted
  from public.votes as v
  where v.run_id = new.run_id and v.beat_index = new.beat_index;

  -- The denominator travels with the count. A projector renders once and a
  -- room fills up afterwards, so a number the page was born with goes stale
  -- the moment somebody arrives late; this one is read at the moment of the
  -- vote and is right by construction.
  select count(*) into v_members
  from public.memberships as m
  join public.meetings as mt on mt.group_id = m.group_id
  join public.scenario_runs as r on r.meeting_id = mt.id
  where r.id = new.run_id;

  begin
    perform realtime.send(
      jsonb_build_object(
        'beatIndex', new.beat_index,
        'voted', v_voted,
        'members', v_members
      ),
      'count',
      'room:' || new.run_id::text,
      true
    );
  exception when others then
    raise warning 'could not broadcast the vote count for run %: %',
      new.run_id, sqlerrm;
  end;

  return null;
end;
$$;

create trigger votes_announce_count
  after insert or update on public.votes
  for each row execute function private.announce_vote_count();

-- ------------------------------------------------- transitions, and the tie
--
-- Phase 5's four functions are replaced rather than amended so that the whole
-- of each one reads in one place. The only change is the `tie` column: set
-- when a vote closes level, and cleared by every transition that leaves the
-- tied state.

create or replace function public.open_vote(p_run_id uuid)
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
begin
  v_run := private.lock_run_as_leader(p_run_id);
  if v_run.state <> 'idle' then
    raise exception 'this run has already started'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.scenario_runs
  set state = 'voting', current_beat = 0, tie = null
  where id = p_run_id
  returning * into v_run;

  return v_run;
end;
$$;

create or replace function public.close_vote(p_run_id uuid, p_choice_keys text[])
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
  v_tally jsonb;
  v_leaders text[];
begin
  v_run := private.lock_run_as_leader(p_run_id);
  if v_run.state <> 'voting' then
    raise exception 'voting is already closed'
      using errcode = 'invalid_parameter_value';
  end if;

  v_tally := private.beat_tally(p_run_id, v_run.current_beat, p_choice_keys);
  v_leaders := private.tally_leaders(v_tally);

  if array_length(v_leaders, 1) = 1 then
    insert into public.beat_results (run_id, beat_index, winning_choice, tally)
    values (p_run_id, v_run.current_beat, v_leaders[1], v_tally);

    update public.scenario_runs set state = 'revealing', tie = null
    where id = p_run_id
    returning * into v_run;
  else
    -- The tie is written with the state that caused it, in the same
    -- transaction and under the same lock, so no screen can read one without
    -- the other.
    update public.scenario_runs
    set state = 'tied',
        tie = jsonb_build_object('tied', to_jsonb(v_leaders), 'tally', v_tally)
    where id = p_run_id
    returning * into v_run;
  end if;

  return v_run;
end;
$$;

create or replace function public.break_tie(
  p_run_id uuid,
  p_choice text,
  p_choice_keys text[]
)
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
  v_tally jsonb;
  v_leaders text[];
begin
  v_run := private.lock_run_as_leader(p_run_id);
  if v_run.state <> 'tied' then
    raise exception 'there is no tie to break'
      using errcode = 'invalid_parameter_value';
  end if;

  v_tally := private.beat_tally(p_run_id, v_run.current_beat, p_choice_keys);
  v_leaders := private.tally_leaders(v_tally);

  if not (p_choice = any (v_leaders)) then
    raise exception 'pick one of the options the room tied on'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.beat_results
    (run_id, beat_index, winning_choice, tally, decided_by_leader)
  values (p_run_id, v_run.current_beat, p_choice, v_tally, true);

  update public.scenario_runs set state = 'revealing', tie = null
  where id = p_run_id
  returning * into v_run;

  return v_run;
end;
$$;

create or replace function public.advance_run(p_run_id uuid, p_beat_count smallint)
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
begin
  v_run := private.lock_run_as_leader(p_run_id);
  if v_run.state <> 'revealing' then
    raise exception 'nothing has been revealed yet'
      using errcode = 'invalid_parameter_value';
  end if;

  if v_run.current_beat + 1 >= p_beat_count then
    update public.scenario_runs set state = 'complete', tie = null
    where id = p_run_id
    returning * into v_run;
  else
    update public.scenario_runs
    set state = 'voting', current_beat = v_run.current_beat + 1, tie = null
    where id = p_run_id
    returning * into v_run;
  end if;

  return v_run;
end;
$$;

-- --------------------------------------------------------- starting a meeting

/**
 * A meeting and its first run, together.
 *
 * Two inserts that must both happen: a meeting with no run is a dead row a
 * leader cannot see or delete, and a run with no meeting cannot exist at all.
 * Doing it in one function also lets a group have exactly one live meeting —
 * starting a second ends the first — so a projector and a phone looking for
 * "what is live in this group" can never find two answers.
 *
 * Ending the previous meeting does not touch its runs. What a group voted last
 * fortnight stays exactly as it was; only the meeting stops being the live one.
 */
create or replace function public.start_meeting(
  p_group_id uuid,
  p_session_number smallint,
  p_scenario_id text
)
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meeting_id uuid;
  v_run public.scenario_runs;
begin
  if not private.leads_group(p_group_id) then
    raise exception 'only the leader of a group can start its meeting'
      using errcode = 'insufficient_privilege';
  end if;
  if p_session_number is null or p_session_number not between 1 and 10 then
    raise exception 'that is not a session in this curriculum'
      using errcode = 'invalid_parameter_value';
  end if;
  if p_scenario_id !~ '^s\d{1,2}-[a-z0-9-]+$' then
    raise exception 'that is not a scenario'
      using errcode = 'invalid_parameter_value';
  end if;

  update public.meetings
  set status = 'ended', ended_at = coalesce(ended_at, now())
  where group_id = p_group_id and status = 'live';

  insert into public.meetings (group_id, session_number, status, started_at)
  values (p_group_id, p_session_number, 'live', now())
  returning id into v_meeting_id;

  insert into public.scenario_runs (meeting_id, scenario_id)
  values (v_meeting_id, p_scenario_id)
  returning * into v_run;

  return v_run;
end;
$$;

/** Ending a meeting. The run and its results stay; only "live" goes away. */
create or replace function public.end_meeting(p_meeting_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id
  from public.meetings where id = p_meeting_id;
  if not found then
    raise exception 'no such meeting' using errcode = 'no_data_found';
  end if;
  if not private.leads_group(v_group_id) then
    raise exception 'only the leader of a group can end its meeting'
      using errcode = 'insufficient_privilege';
  end if;

  update public.meetings
  set status = 'ended', ended_at = coalesce(ended_at, now())
  where id = p_meeting_id;
end;
$$;

-- -------------------------------------------------------------------- grants

revoke all on function public.start_meeting(uuid, smallint, text) from public, anon;
revoke all on function public.end_meeting(uuid) from public, anon;
grant execute on function public.start_meeting(uuid, smallint, text) to authenticated;
grant execute on function public.end_meeting(uuid) to authenticated;
