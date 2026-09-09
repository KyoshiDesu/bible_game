-- Phase 5 — the live session room.
--
-- The database is authoritative, not the leader's laptop. A `scenario_runs` row
-- holds the state and the current beat, and every screen in the building —
-- including the leader's own — renders from what that row says. That is what
-- stops the projector being on beat three while half the phones are on beat two.
--
-- Four transitions, each a function that takes a row lock before it looks at
-- anything:
--
--   idle → voting → revealing → voting → … → complete
--                ↘ tied ↗
--
-- The same rules exist as pure functions in lib/room/machine.ts, where they can
-- be tested exhaustively without a database. These are not duplicated checks so
-- much as one rule stated where it can be tested and stated again where it can
-- be enforced against two requests arriving at once.
--
-- Scenario content stays in the repository, so these functions do not know what
-- a beat contains. The choice keys and the beat count arrive as parameters from
-- the caller, who has the scenario; the functions verify what they can — that
-- no vote names a choice outside the list, that a tie is broken among the
-- options that tied — and are honest about trusting the leader for the rest,
-- since the leader is already the authority on their own run.

-- ------------------------------------------------------------------ meetings

create type public.meeting_status as enum ('scheduled', 'live', 'ended');

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  session_number smallint not null
    constraint meetings_session_range check (session_number between 1 and 10),
  status public.meeting_status not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.meetings is
  'One row each time a group actually meets on a session, so a group can re-run a session and both runs are kept.';

create index meetings_group_id_idx on public.meetings (group_id, session_number);

-- ------------------------------------------------------------- scenario runs

create type public.run_state as enum (
  'idle', 'voting', 'tied', 'revealing', 'complete'
);

create table public.scenario_runs (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  /** Names a scenario in content/scenarios, which is not in this database. */
  scenario_id text not null
    constraint scenario_runs_id_shape check (scenario_id ~ '^s\d{1,2}-[a-z0-9-]+$'),
  current_beat smallint not null default 0
    constraint scenario_runs_beat_range check (current_beat between 0 and 20),
  state public.run_state not null default 'idle',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenario_runs_meeting_id_idx on public.scenario_runs (meeting_id);

create trigger scenario_runs_set_updated_at
  before update on public.scenario_runs
  for each row execute function private.set_updated_at();

-- --------------------------------------------------------------------- votes

create table public.votes (
  run_id uuid not null references public.scenario_runs (id) on delete cascade,
  beat_index smallint not null
    constraint votes_beat_range check (beat_index between 0 and 20),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  choice_key text not null
    constraint votes_choice_shape check (choice_key ~ '^[a-z]$'),
  cast_at timestamptz not null default now(),
  primary key (run_id, beat_index, profile_id)
);

comment on table public.votes is
  'One vote per person per beat. Readable only by its author: the tally reaches the room through beat_results, never through these rows, so nobody can ask who voted for the option that lost.';

-- ---------------------------------------------------------------- beat results

create table public.beat_results (
  run_id uuid not null references public.scenario_runs (id) on delete cascade,
  beat_index smallint not null,
  winning_choice text not null
    constraint beat_results_choice_shape check (winning_choice ~ '^[a-z]$'),
  tally jsonb not null,
  /** True when the room tied and the leader chose. */
  decided_by_leader boolean not null default false,
  decided_at timestamptz not null default now(),
  primary key (run_id, beat_index)
);

comment on table public.beat_results is
  'Frozen at the moment voting closed. Recomputing from votes at read time would let a vote arriving half a second late change what the room already saw.';

-- ------------------------------------------------------------------- helpers

/** The group a run belongs to, for the policies that ask about membership. */
create or replace function private.run_group(p_run_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.group_id
  from public.scenario_runs as r
  join public.meetings as m on m.id = r.meeting_id
  where r.id = p_run_id;
$$;

/** Whether this run is open for votes on this beat, right now. */
create or replace function private.run_accepts_vote(p_run_id uuid, p_beat smallint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.scenario_runs as r
    where r.id = p_run_id
      and r.state = 'voting'
      and r.current_beat = p_beat
  );
$$;

-- ------------------------------------------------------------------ policies

alter table public.meetings enable row level security;
alter table public.scenario_runs enable row level security;
alter table public.votes enable row level security;
alter table public.beat_results enable row level security;

-- meetings ------------------------------------------------------------------

create policy meetings_select_members on public.meetings
  for select to authenticated
  using (private.is_member(group_id));

create policy meetings_insert_leader on public.meetings
  for insert to authenticated
  with check (private.leads_group(group_id));

create policy meetings_update_leader on public.meetings
  for update to authenticated
  using (private.leads_group(group_id))
  with check (private.leads_group(group_id));

-- scenario_runs --------------------------------------------------------------
--
-- The leader may create a run and may end one. Every state transition goes
-- through the functions below instead, so that "is this transition legal from
-- the current state" is answered under a lock rather than by whoever wrote the
-- update.

-- Reached through the row's own meeting_id rather than through run_group(id).
-- `insert ... returning` runs this policy against the new row, and a STABLE
-- function reading scenario_runs uses the snapshot from before that insert — so
-- asking about the run by its own id returns nothing and the leader is refused
-- the row they have just written.
create policy scenario_runs_select_members on public.scenario_runs
  for select to authenticated
  using (
    private.is_member(
      (select m.group_id from public.meetings as m where m.id = meeting_id)
    )
  );

create policy scenario_runs_insert_leader on public.scenario_runs
  for insert to authenticated
  with check (
    private.leads_group((select m.group_id from public.meetings as m where m.id = meeting_id))
  );

-- votes ----------------------------------------------------------------------

create policy votes_select_own on public.votes
  for select to authenticated
  using (profile_id = (select auth.uid()));

-- No insert or update policy. Votes are written by cast_vote below, which takes
-- a shared lock on the run row first.
--
-- A direct insert would be racy in a way a policy cannot fix: the policy asks
-- whether the run is still `voting`, and under read-committed it gets the
-- answer from before an in-flight close committed. The vote would then exist
-- without being in the tally the room saw — which is precisely the tear the
-- design says cannot happen.

-- beat_results ---------------------------------------------------------------
--
-- Readable by the room, written by nobody: the two functions below are the only
-- things that insert here, and they run as the table's owner.

create policy beat_results_select_members on public.beat_results
  for select to authenticated
  using (private.is_member(private.run_group(run_id)));

-- ---------------------------------------------------------------- voting

/**
 * Casting a vote.
 *
 * The shared lock is the whole point. A vote arriving while a close is in
 * flight blocks here until that close commits, and then reads the state it
 * actually left behind — so it either lands before the aggregate and is
 * counted, or is refused. There is no third outcome in which a vote exists but
 * is missing from the tally the room was shown.
 *
 * The foreign key from votes to scenario_runs takes a KEY SHARE lock on the
 * same row and blocks against the same FOR UPDATE, so the guarantee has two
 * sources rather than one. That is worth knowing but not worth relying on: a
 * later schema change that drops the reference would remove it silently, and
 * the explicit lock is what states the intent.
 *
 * The voter is `auth.uid()` rather than a parameter, so this cannot be used to
 * vote on someone else's behalf.
 */
create or replace function public.cast_vote(
  p_run_id uuid,
  p_beat smallint,
  p_choice text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
  v_voter uuid := (select auth.uid());
begin
  if v_voter is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;
  if p_choice !~ '^[a-z]$' then
    raise exception 'that is not a choice' using errcode = 'invalid_parameter_value';
  end if;

  select * into v_run from public.scenario_runs where id = p_run_id for share;
  if not found then
    raise exception 'no such run' using errcode = 'no_data_found';
  end if;

  if not private.is_member(private.run_group(p_run_id)) then
    raise exception 'you are not in this group' using errcode = 'insufficient_privilege';
  end if;

  if v_run.state <> 'voting' or v_run.current_beat <> p_beat then
    raise exception 'voting is not open on that beat'
      using errcode = 'invalid_parameter_value';
  end if;

  insert into public.votes (run_id, beat_index, profile_id, choice_key)
  values (p_run_id, p_beat, v_voter, p_choice)
  on conflict (run_id, beat_index, profile_id)
  do update set choice_key = excluded.choice_key, cast_at = now();
end;
$$;

-- ---------------------------------------------------------------- transitions

/** Locks the run and refuses anyone who does not lead its group. */
create or replace function private.lock_run_as_leader(p_run_id uuid)
returns public.scenario_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.scenario_runs;
begin
  select * into v_run from public.scenario_runs where id = p_run_id for update;
  if not found then
    raise exception 'no such run' using errcode = 'no_data_found';
  end if;
  if not private.leads_group(private.run_group(p_run_id)) then
    raise exception 'only the leader of this group can drive this run'
      using errcode = 'insufficient_privilege';
  end if;
  return v_run;
end;
$$;

/** The tally for a beat, with every offered choice seeded at zero. */
create or replace function private.beat_tally(
  p_run_id uuid,
  p_beat smallint,
  p_choice_keys text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tally jsonb;
begin
  if p_choice_keys is null or array_length(p_choice_keys, 1) is null then
    raise exception 'a beat must offer choices' using errcode = 'invalid_parameter_value';
  end if;

  -- A vote for a key this beat does not offer means the caller is holding a
  -- different scenario than the room voted on. Refusing is the only safe
  -- answer: seeding around it would silently drop somebody's vote.
  if exists (
    select 1 from public.votes as v
    where v.run_id = p_run_id
      and v.beat_index = p_beat
      and not (v.choice_key = any (p_choice_keys))
  ) then
    raise exception 'a vote names a choice this beat does not offer'
      using errcode = 'invalid_parameter_value';
  end if;

  select jsonb_object_agg(offered.key, coalesce(counted.n, 0))
  into v_tally
  from unnest(p_choice_keys) as offered(key)
  left join (
    select v.choice_key, count(*) as n
    from public.votes as v
    where v.run_id = p_run_id and v.beat_index = p_beat
    group by v.choice_key
  ) as counted on counted.choice_key = offered.key;

  return v_tally;
end;
$$;

/** The choices holding the maximum count, ordered, so two screens agree. */
create or replace function private.tally_leaders(p_tally jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array_agg(entry.key order by entry.key)
  from jsonb_each_text(p_tally) as entry(key, value)
  where entry.value::int = (
    select max(inner_entry.value::int)
    from jsonb_each_text(p_tally) as inner_entry(key, value)
  );
$$;

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
  set state = 'voting', current_beat = 0
  where id = p_run_id
  returning * into v_run;

  return v_run;
end;
$$;

/**
 * Closing a vote: one transaction, one lock.
 *
 * Votes arriving mid-close either land before the aggregate or are refused by
 * the insert policy after it, because that policy asks whether the run is still
 * `voting` and this transaction holds the row. There is no window in which the
 * tally can tear.
 *
 * A tie writes no result row. The run moves to `tied`, the projector shows the
 * options that tied, and the leader picks one — which is the most interesting
 * thing that can happen in a case study, so the design hands it over as a
 * moment rather than resolving it silently.
 */
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

    update public.scenario_runs set state = 'revealing'
    where id = p_run_id
    returning * into v_run;
  else
    update public.scenario_runs set state = 'tied'
    where id = p_run_id
    returning * into v_run;
  end if;

  return v_run;
end;
$$;

/**
 * Breaking a tie: the same lock, and the leader picks among the options that
 * tied. `beat_results` therefore holds exactly one row per resolved beat,
 * whether the room resolved it or the leader did.
 */
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

  update public.scenario_runs set state = 'revealing'
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
    update public.scenario_runs set state = 'complete'
    where id = p_run_id
    returning * into v_run;
  else
    update public.scenario_runs
    set state = 'voting', current_beat = v_run.current_beat + 1
    where id = p_run_id
    returning * into v_run;
  end if;

  return v_run;
end;
$$;

-- -------------------------------------------------------------------- grants

grant select, insert, update on public.meetings to authenticated;
grant select, insert on public.scenario_runs to authenticated;
-- Select only: cast_vote is the only way a vote is written.
grant select on public.votes to authenticated;
grant select on public.beat_results to authenticated;

-- Each function checks that the caller leads the run's group as its first act,
-- which is what makes it safe to hand to `authenticated`.
revoke all on function public.cast_vote(uuid, smallint, text) from public, anon;
grant execute on function public.cast_vote(uuid, smallint, text) to authenticated;

revoke all on function public.open_vote(uuid) from public, anon;
revoke all on function public.close_vote(uuid, text[]) from public, anon;
revoke all on function public.break_tie(uuid, text, text[]) from public, anon;
revoke all on function public.advance_run(uuid, smallint) from public, anon;
grant execute on function public.open_vote(uuid) to authenticated;
grant execute on function public.close_vote(uuid, text[]) to authenticated;
grant execute on function public.break_tie(uuid, text, text[]) to authenticated;
grant execute on function public.advance_run(uuid, smallint) to authenticated;
