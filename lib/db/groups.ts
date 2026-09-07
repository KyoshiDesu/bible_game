import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";

export type MembershipRole = "leader" | "participant";

export interface Group {
  id: string;
  name: string;
  leaderId: string;
  joinCode: string;
  archivedAt: string | null;
}

export interface RosterEntry {
  profileId: string;
  displayName: string;
  role: MembershipRole;
  joinedAt: string;
}

interface GroupRow {
  id: string;
  name: string;
  leader_id: string;
  join_code: string;
  archived_at: string | null;
}

function toGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    leaderId: row.leader_id,
    joinCode: row.join_code,
    archivedAt: row.archived_at,
  };
}

const GROUP_COLUMNS = "id, name, leader_id, join_code, archived_at";

/**
 * Every group the caller can see. Row-level security decides what that means —
 * a leader's own groups and any group they are a member of — so this does not
 * filter by user and must not start to.
 */
export async function listGroups(client: SupabaseClient): Promise<Group[]> {
  const { data, error } = await client
    .from("groups")
    .select(GROUP_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as GroupRow[]).map(toGroup);
}

export async function findGroup(
  client: SupabaseClient,
  id: string,
): Promise<Group | null> {
  const { data, error } = await client
    .from("groups")
    .select(GROUP_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toGroup(data as GroupRow) : null;
}

export async function roster(
  client: SupabaseClient,
  groupId: string,
): Promise<RosterEntry[]> {
  const { data, error } = await client
    .from("memberships")
    .select("profile_id, role, joined_at, profiles ( display_name )")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  // PostgREST returns the embedded profile as an object for a to-one relation,
  // but without generated database types supabase-js infers an array. Accept
  // both rather than asserting one and being wrong on the day it changes.
  type Embedded = { display_name: string } | { display_name: string }[] | null;
  const rows = data as unknown as {
    profile_id: string;
    role: MembershipRole;
    joined_at: string;
    profiles: Embedded;
  }[];

  return rows.map((row) => {
    const profile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;
    return {
      profileId: row.profile_id,
      displayName: profile?.display_name ?? "Someone",
      role: row.role,
      joinedAt: row.joined_at,
    };
  });
}

export interface Profile {
  id: string;
  displayName: string;
}

export async function findProfile(
  client: SupabaseClient,
  id: string,
): Promise<Profile | null> {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { id: data.id as string, displayName: data.display_name as string }
    : null;
}
