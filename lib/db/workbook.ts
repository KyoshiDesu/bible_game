import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";

import { type MembershipRole } from "./groups";

/**
 * The three take-home cards each session carries. `reflection` is the open one:
 * whatever the session left the participant with.
 */
export type WorkbookKind = "reflection" | "challenge" | "practice";

export const WORKBOOK_KINDS: readonly WorkbookKind[] = [
  "reflection",
  "challenge",
  "practice",
];

export interface WorkbookEntry {
  sessionNumber: number;
  kind: WorkbookKind;
  body: string;
  updatedAt: string;
}

interface EntryRow {
  session_number: number;
  kind: WorkbookKind;
  body: string;
  updated_at: string;
}

const ENTRY_COLUMNS = "session_number, kind, body, updated_at";

/**
 * Every entry the caller has written in this group.
 *
 * There is no `profile_id` filter here and there must not be one: row-level
 * security already restricts this to the caller's own rows, and a filter would
 * suggest the restriction is this function's job.
 */
export async function listEntries(
  client: SupabaseClient,
  groupId: string,
): Promise<WorkbookEntry[]> {
  const { data, error } = await client
    .from("workbook_entries")
    .select(ENTRY_COLUMNS)
    .eq("group_id", groupId);
  if (error) throw error;
  return (data as EntryRow[]).map((row) => ({
    sessionNumber: row.session_number,
    kind: row.kind,
    body: row.body,
    updatedAt: row.updated_at,
  }));
}

/** The three entries for one session, keyed by kind, blank where unwritten. */
export async function entriesForSession(
  client: SupabaseClient,
  groupId: string,
  sessionNumber: number,
): Promise<Record<WorkbookKind, string>> {
  const { data, error } = await client
    .from("workbook_entries")
    .select(ENTRY_COLUMNS)
    .eq("group_id", groupId)
    .eq("session_number", sessionNumber);
  if (error) throw error;

  const bodies: Record<WorkbookKind, string> = {
    reflection: "",
    challenge: "",
    practice: "",
  };
  for (const row of data as EntryRow[]) bodies[row.kind] = row.body;
  return bodies;
}

export interface RuleOfPlayEntry {
  profileId: string;
  sections: Record<string, string>;
  oneSentence: string;
  shared: boolean;
}

interface RuleRow {
  profile_id: string;
  sections: Record<string, string>;
  one_sentence: string;
  shared: boolean;
}

const RULE_COLUMNS = "profile_id, sections, one_sentence, shared";

function toRule(row: RuleRow): RuleOfPlayEntry {
  return {
    profileId: row.profile_id,
    sections: row.sections ?? {},
    oneSentence: row.one_sentence,
    shared: row.shared,
  };
}

export async function findRuleOfPlay(
  client: SupabaseClient,
  groupId: string,
  profileId: string,
): Promise<RuleOfPlayEntry | null> {
  const { data, error } = await client
    .from("rule_of_play")
    .select(RULE_COLUMNS)
    .eq("group_id", groupId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRule(data as RuleRow) : null;
}

/**
 * The rules of play visible in this group: the caller's own, and anyone else's
 * they have chosen to share. Which is which is decided by the policy, not here.
 */
export async function listVisibleRules(
  client: SupabaseClient,
  groupId: string,
): Promise<RuleOfPlayEntry[]> {
  const { data, error } = await client
    .from("rule_of_play")
    .select(RULE_COLUMNS)
    .eq("group_id", groupId);
  if (error) throw error;
  return (data as RuleRow[]).map(toRule);
}

export interface EngagementRow {
  profileId: string;
  displayName: string;
  role: MembershipRole;
  /** Session number to the number of entries written. Never a body. */
  sessionsWritten: Record<string, number>;
  ruleOfPlayWritten: boolean;
  ruleOfPlayShared: boolean;
}

/**
 * Who has written, and nothing about what. The database function this calls is
 * the only thing in the application that reads across participants, and it
 * returns counts — see the migration.
 */
export async function groupEngagement(
  client: SupabaseClient,
  groupId: string,
): Promise<EngagementRow[]> {
  const { data, error } = await client.rpc("group_engagement", {
    p_group_id: groupId,
  });
  if (error) throw error;
  return (
    data as {
      profile_id: string;
      display_name: string;
      role: MembershipRole;
      sessions_written: Record<string, number>;
      rule_of_play_written: boolean;
      rule_of_play_shared: boolean;
    }[]
  ).map((row) => ({
    profileId: row.profile_id,
    displayName: row.display_name,
    role: row.role,
    sessionsWritten: row.sessions_written ?? {},
    ruleOfPlayWritten: row.rule_of_play_written,
    ruleOfPlayShared: row.rule_of_play_shared,
  }));
}
