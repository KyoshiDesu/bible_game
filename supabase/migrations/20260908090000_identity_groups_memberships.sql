-- Phase 3 — identity, groups, and joining.
--
-- Three tables and the helpers that guard them. Row-level security is on for
-- every table and denies by default: nothing here has a permissive policy, so
-- a table without a matching policy is unreadable rather than public.
--
-- Two conventions are load-bearing throughout:
--
--   * `(select auth.uid())` rather than `auth.uid()`. Postgres evaluates the
--     bare call once per row; wrapped in a scalar subquery it is evaluated once
--     per statement.
--
--   * Anonymous participants carry the `authenticated` Postgres role, exactly
--     like a signed-in leader. A policy written as `auth.role() =
--     'authenticated'` would therefore pass for everybody and protect nothing.
--     Every policy below names an owner or a membership instead.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
comment on schema private is
  'Helpers and bookkeeping that must not be reachable through the Data API. Not listed in config.toml db.schemas, so PostgREST never exposes it.';

-- ---------------------------------------------------------------- utilities

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when the caller signed in for real rather than anonymously. Supabase
-- puts `is_anonymous` in the JWT; the Postgres role is `authenticated` either
-- way, so this is the only honest way to tell them apart.
create or replace function private.is_identified()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) is not true;
$$;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    constraint profiles_display_name_length
      check (char_length(btrim(display_name)) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per person, keyed to auth.users. A participant''s row is created by join_group; a leader creates their own after the magic link lands.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------------ groups

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null
    constraint groups_name_length check (char_length(btrim(name)) between 1 and 80),
  leader_id uuid not null references public.profiles (id) on delete restrict,
  -- Six characters from a 31-character alphabet with the visually ambiguous
  -- ones removed: no 0, O, 1, I, or L. 31^6 is about 887 million.
  join_code text not null
    constraint groups_join_code_shape
      check (join_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.groups.join_code is
  'Unique among active groups only, so an archived group releases its code.';

-- Unique per *active* group, per the design: archiving frees the code again.
create unique index groups_active_join_code_key
  on public.groups (join_code)
  where archived_at is null;

create index groups_leader_id_idx on public.groups (leader_id);

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------- memberships

create type public.membership_role as enum ('leader', 'participant');

comment on type public.membership_role is
  'Role lives on the membership, not the profile: the same person can lead one group and sit in another.';

create table public.memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'participant',
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

-- The primary key indexes (group_id, profile_id); policies and the roster also
-- look a person up across groups, which needs the other direction.
create index memberships_profile_id_idx on public.memberships (profile_id);

-- ----------------------------------------------------- membership helpers
--
-- These are SECURITY DEFINER so that a policy on `memberships` can ask about
-- `memberships` without recursing through its own policy. Each one is
-- restricted to the calling user by `auth.uid()` inside the body, so being
-- able to call it tells you nothing you did not already know about yourself.

create or replace function private.is_member(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as m
    where m.group_id = is_member.group_id
      and m.profile_id = (select auth.uid())
  );
$$;

create or replace function private.leads_group(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.groups as g
    where g.id = leads_group.group_id
      and g.leader_id = (select auth.uid())
  );
$$;

-- Whether the caller shares any group with this person. This is what lets a
-- roster show display names without opening `profiles` to everyone.
create or replace function private.shares_group(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as mine
    join public.memberships as theirs on theirs.group_id = mine.group_id
    where mine.profile_id = (select auth.uid())
      and theirs.profile_id = shares_group.profile_id
  );
$$;

-- ----------------------------------------------------------- rate limiting
--
-- Only *failed* join attempts are counted. A whole group arrives from one
-- church wifi address inside a couple of minutes, so limiting total attempts
-- would lock out the back half of the room; limiting failures leaves
-- legitimate joining untouched and still makes code guessing pointless.

create table private.join_attempts (
  id bigint generated always as identity primary key,
  ip inet not null,
  attempted_at timestamptz not null default now()
);

comment on table private.join_attempts is
  'Failed join attempts only. Lives in the private schema, so no client can read it, and is pruned to the last hour on every write.';

create index join_attempts_ip_attempted_at_idx
  on private.join_attempts (ip, attempted_at desc);

-- These two live in `public` because PostgREST can only call functions in an
-- exposed schema, and the server reaches them through the Data API like
-- anything else. The table they touch stays in `private`, and execution is
-- granted to service_role alone, so a browser can neither read the attempts
-- nor manufacture them.
create or replace function public.record_failed_join(p_ip inet)
returns void
language sql
security definer
set search_path = ''
as $$
  with pruned as (
    delete from private.join_attempts
    where attempted_at < now() - interval '1 hour'
  )
  insert into private.join_attempts (ip) values (p_ip);
$$;

create or replace function public.failed_joins_last_minute(p_ip inet)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from private.join_attempts as a
  where a.ip = p_ip
    and a.attempted_at > now() - interval '1 minute';
$$;

-- ------------------------------------------------------------------ policies
--
-- RLS on, deny by default. Every policy names the role it applies to, so the
-- `anon` role (a request with no session at all) matches nothing.

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;

-- profiles ------------------------------------------------------------------

create policy profiles_select_own_or_shared on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_group(id));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- An UPDATE policy needs both USING and WITH CHECK: without WITH CHECK a row
-- could be updated into a shape the policy would never have allowed.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- groups --------------------------------------------------------------------

-- The leader is named separately from membership. `insert ... returning` runs
-- the SELECT policy against the new row, so a policy that only asked about
-- membership would refuse to hand a leader back the group they had just made —
-- and Postgres reports that as a WITH CHECK violation, which sends you looking
-- in the wrong place entirely.
create policy groups_select_members on public.groups
  for select to authenticated
  using (private.is_member(id) or leader_id = (select auth.uid()));

-- No insert policy. Groups are created through create_group, which writes the
-- group and its leader's membership in one transaction; done as two client
-- round-trips, a failure between them leaves a group with no leader in it.

create policy groups_update_leader on public.groups
  for update to authenticated
  using (leader_id = (select auth.uid()))
  with check (leader_id = (select auth.uid()));

-- No delete policy: groups are archived, never removed, so a meeting's history
-- cannot disappear underneath it.

-- memberships ---------------------------------------------------------------

create policy memberships_select_members on public.memberships
  for select to authenticated
  using (private.is_member(group_id));

-- No insert policy. Joining goes through join_group, which checks the code;
-- letting a client insert its own membership would make the code decorative.

-- No update policy either, which is what stops a participant promoting
-- themselves to leader.

create policy memberships_delete_self_or_leader on public.memberships
  for delete to authenticated
  using (profile_id = (select auth.uid()) or private.leads_group(group_id));

-- ------------------------------------------------------------------ creating

-- Runs as definer so the group and its leader's membership are one write. The
-- leader is `auth.uid()` rather than a parameter, so this cannot be used to
-- make someone else a leader, and anonymous participants are refused outright.
create or replace function public.create_group(p_name text, p_join_code text)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups;
  v_leader uuid := (select auth.uid());
  v_name text := btrim(p_name);
begin
  if v_leader is null then
    raise exception 'not signed in' using errcode = 'insufficient_privilege';
  end if;

  if not private.is_identified() then
    raise exception 'anonymous users cannot lead a group'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.profiles as p where p.id = v_leader) then
    raise exception 'set a display name before creating a group'
      using errcode = 'foreign_key_violation';
  end if;

  insert into public.groups (name, leader_id, join_code)
  values (v_name, v_leader, upper(btrim(p_join_code)))
  returning * into v_group;

  insert into public.memberships (group_id, profile_id, role)
  values (v_group.id, v_leader, 'leader');

  return v_group;
end;
$$;

-- -------------------------------------------------------------------- joining

-- Runs as definer so it can read `groups` by code without `groups` being
-- readable by non-members — which is what keeps codes from being enumerable.
--
-- The caller's id is a parameter rather than auth.uid() because only the
-- server knows the requester's IP, and the rate limit has to be applied where
-- that is true. Execution is therefore restricted to service_role: the browser
-- cannot reach this, and the server action that can has already verified the
-- session it passes in.
create or replace function public.join_group(
  p_profile_id uuid,
  p_code text,
  p_display_name text
)
returns public.groups
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups;
  v_name text := btrim(p_display_name);
begin
  if char_length(v_name) < 1 or char_length(v_name) > 60 then
    raise exception 'display name must be between 1 and 60 characters'
      using errcode = 'check_violation';
  end if;

  select * into v_group
  from public.groups as g
  where g.join_code = upper(btrim(p_code))
    and g.archived_at is null;

  if not found then
    raise exception 'no active group with that code'
      using errcode = 'no_data_found';
  end if;

  insert into public.profiles (id, display_name)
  values (p_profile_id, v_name)
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.memberships (group_id, profile_id, role)
  values (v_group.id, p_profile_id, 'participant')
  on conflict (group_id, profile_id) do nothing;

  return v_group;
end;
$$;

-- ------------------------------------------------------------------- grants
--
-- PostgREST reaches tables through the `anon` and `authenticated` roles, and a
-- grant is a separate gate from a policy: without it a request is refused
-- before any policy is consulted. Granting only what the policies can allow
-- keeps the two in step.

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
-- No insert: create_group is the only way a group comes into being.
grant select, update on public.groups to authenticated;
grant select, delete on public.memberships to authenticated;

-- Everything in the private schema, and the join RPC, is server-only.
revoke all on function public.create_group(text, text) from public, anon;
grant execute on function public.create_group(text, text) to authenticated;

revoke all on function public.join_group(uuid, text, text) from public, anon, authenticated;
grant execute on function public.join_group(uuid, text, text) to service_role;

revoke all on function public.record_failed_join(inet) from public, anon, authenticated;
revoke all on function public.failed_joins_last_minute(inet) from public, anon, authenticated;
grant execute on function public.record_failed_join(inet) to service_role;
grant execute on function public.failed_joins_last_minute(inet) to service_role;
