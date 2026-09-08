-- Phase 4 — the workbook.
--
-- Two tables, and the one function that lets a leader see engagement without
-- seeing anything a participant wrote.
--
-- This is the curriculum where Session 6 is about four hundred dollars and
-- Session 4 is about a short fuse. The design records two policies as pastoral
-- decisions rather than technical ones, and they are the reason this migration
-- looks the way it does:
--
--   * A participant reads only their own entries. Not their group's, not their
--     leader's — their own.
--   * The leader cannot read entry bodies at all. Engagement is visible;
--     content is not. There is no view, no join, and no admin path that
--     returns `body` to anybody but its author.
--
-- Rule-of-play entries are private on the same terms, with an explicit `shared`
-- flag the participant sets themselves. Session 10 works better when some
-- people volunteer, and volunteering has to be a choice.

-- ------------------------------------------------------------------- entries

create type public.workbook_kind as enum ('reflection', 'challenge', 'practice');

comment on type public.workbook_kind is
  'The three take-home cards each session already carries.';

create table public.workbook_entries (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  session_number smallint not null
    constraint workbook_entries_session_range check (session_number between 1 and 10),
  kind public.workbook_kind not null,
  body text not null default ''
    constraint workbook_entries_body_length check (char_length(body) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, group_id, session_number, kind)
);

comment on table public.workbook_entries is
  'One row per participant, group, session, and kind. Only the author can read the body — see the policies below, and the tests that hold them to it.';

-- The primary key leads with profile_id, which is right for a participant
-- reading their own workbook. The engagement function reads the other way.
create index workbook_entries_group_session_idx
  on public.workbook_entries (group_id, session_number);

create trigger workbook_entries_set_updated_at
  before update on public.workbook_entries
  for each row execute function private.set_updated_at();

-- -------------------------------------------------------------- rule of play

create table public.rule_of_play (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  -- Keyed by the headings on the Session 10 worksheet, so the printed sheet and
  -- this row stay the same document. The keys are checked against
  -- content/rule-of-play.ts by the test suite rather than pinned here, which
  -- would put the curriculum's prose in a migration.
  sections jsonb not null default '{}'::jsonb
    constraint rule_of_play_sections_object check (jsonb_typeof(sections) = 'object'),
  one_sentence text not null default ''
    constraint rule_of_play_sentence_length check (char_length(one_sentence) <= 500),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, group_id)
);

comment on column public.rule_of_play.shared is
  'Set by the participant, and by nobody else. Sharing is a choice, so the read policy asks this column rather than asking the leader.';

create index rule_of_play_shared_idx
  on public.rule_of_play (group_id)
  where shared;

create trigger rule_of_play_set_updated_at
  before update on public.rule_of_play
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------------ policies

alter table public.workbook_entries enable row level security;
alter table public.rule_of_play enable row level security;

-- workbook_entries ----------------------------------------------------------
--
-- Own row, in every direction. There is deliberately no policy that mentions a
-- leader, a group, or a role: the only way to widen this is to add a policy,
-- which is a visible change to this file rather than a convenience query
-- somewhere else that quietly starts returning more than it should.

create policy workbook_entries_select_own on public.workbook_entries
  for select to authenticated
  using (profile_id = (select auth.uid()));

create policy workbook_entries_insert_own on public.workbook_entries
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.is_member(group_id));

create policy workbook_entries_update_own on public.workbook_entries
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and private.is_member(group_id));

create policy workbook_entries_delete_own on public.workbook_entries
  for delete to authenticated
  using (profile_id = (select auth.uid()));

-- rule_of_play --------------------------------------------------------------

create policy rule_of_play_select_own_or_shared on public.rule_of_play
  for select to authenticated
  using (
    profile_id = (select auth.uid())
    or (shared and private.is_member(group_id))
  );

create policy rule_of_play_insert_own on public.rule_of_play
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.is_member(group_id));

create policy rule_of_play_update_own on public.rule_of_play
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and private.is_member(group_id));

create policy rule_of_play_delete_own on public.rule_of_play
  for delete to authenticated
  using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------- engagement
--
-- What the leader gets: names, and whether something has been written. Never a
-- body, and never a fragment of one. The function is SECURITY DEFINER because
-- it has to look past the own-row policy to count at all, which makes the
-- leader check inside it the thing standing between a leader and a diary —
-- hence it is the first statement in the body.
--
-- The columns are the whole security argument. If this function ever needs to
-- return more, read the two paragraphs at the top of this file first.

create or replace function public.group_engagement(p_group_id uuid)
returns table (
  profile_id uuid,
  display_name text,
  role public.membership_role,
  sessions_written jsonb,
  rule_of_play_written boolean,
  rule_of_play_shared boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.leads_group(p_group_id) then
    raise exception 'only the leader of a group can see its engagement'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    m.profile_id,
    p.display_name,
    m.role,
    coalesce(
      (
        select jsonb_object_agg(counted.session_number::text, counted.written)
        from (
          select w.session_number, count(*) as written
          from public.workbook_entries as w
          where w.group_id = p_group_id
            and w.profile_id = m.profile_id
            and btrim(w.body) <> ''
          group by w.session_number
        ) as counted
      ),
      '{}'::jsonb
    ) as sessions_written,
    exists (
      select 1
      from public.rule_of_play as r
      where r.group_id = p_group_id
        and r.profile_id = m.profile_id
        and (btrim(r.one_sentence) <> '' or r.sections <> '{}'::jsonb)
    ) as rule_of_play_written,
    coalesce(
      (
        select r.shared
        from public.rule_of_play as r
        where r.group_id = p_group_id and r.profile_id = m.profile_id
      ),
      false
    ) as rule_of_play_shared
  from public.memberships as m
  join public.profiles as p on p.id = m.profile_id
  where m.group_id = p_group_id
  order by p.display_name;
end;
$$;

-- -------------------------------------------------------------------- grants

grant select, insert, update, delete on public.workbook_entries to authenticated;
grant select, insert, update, delete on public.rule_of_play to authenticated;

-- The leader check lives inside the function, so authenticated may call it; a
-- request with no session at all may not.
revoke all on function public.group_engagement(uuid) from public, anon;
grant execute on function public.group_engagement(uuid) to authenticated;
