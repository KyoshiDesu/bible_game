import "server-only";

import { type SupabaseClient } from "@supabase/supabase-js";

import { type BeatResult, type RoomState, type Tie } from "@/lib/room/client";
import { type RunState, type Tally } from "@/lib/room/machine";

export type MeetingStatus = "scheduled" | "live" | "ended";

/** A run, with enough of its meeting and group to render a screen. */
export interface Run {
  id: string;
  scenarioId: string;
  state: RunState;
  currentBeat: number;
  tie: Tie | null;
  meetingId: string;
  sessionNumber: number;
  meetingStatus: MeetingStatus;
  groupId: string;
  groupName: string;
}

/*
 * PostgREST returns an embedded to-one relation as an object, but without
 * generated database types supabase-js infers an array. Accept both rather
 * than asserting one and being wrong on the day it changes.
 */
type Embedded<T> = T | T[] | null;

function one<T>(value: Embedded<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface GroupRow {
  id: string;
  name: string;
}

interface MeetingRow {
  id: string;
  session_number: number;
  status: MeetingStatus;
  group_id: string;
  groups: Embedded<GroupRow>;
}

interface RunRow {
  id: string;
  scenario_id: string;
  state: RunState;
  current_beat: number;
  tie: Tie | null;
  meetings: Embedded<MeetingRow>;
}

const RUN_COLUMNS =
  "id, scenario_id, state, current_beat, tie, meetings!inner ( id, session_number, status, group_id, groups!inner ( id, name ) )";

function toRun(row: RunRow): Run | null {
  const meeting = one(row.meetings);
  const group = meeting ? one(meeting.groups) : null;
  if (!meeting || !group) return null;

  return {
    id: row.id,
    scenarioId: row.scenario_id,
    state: row.state,
    currentBeat: row.current_beat,
    tie: row.tie,
    meetingId: meeting.id,
    sessionNumber: meeting.session_number,
    meetingStatus: meeting.status,
    groupId: meeting.group_id,
    groupName: group.name,
  };
}

/**
 * One run, if the caller may see it.
 *
 * No filter by user: row-level security decides what "may see it" means — a
 * member of the run's group — and this must not start second-guessing that.
 */
export async function findRun(
  client: SupabaseClient,
  runId: string,
): Promise<Run | null> {
  const { data, error } = await client
    .from("scenario_runs")
    .select(RUN_COLUMNS)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRun(data as unknown as RunRow) : null;
}

/**
 * Every live run the caller can reach, newest first.
 *
 * This is how a phone finds the room without being told a URL: a participant
 * opens the app in a meeting and the session that is running is simply there.
 * `start_meeting` allows only one live meeting per group, so a group appears
 * at most once.
 */
export async function liveRuns(client: SupabaseClient): Promise<Run[]> {
  const { data, error } = await client
    .from("scenario_runs")
    .select(RUN_COLUMNS)
    .eq("meetings.status", "live")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as RunRow[])
    .map(toRun)
    .filter((run): run is Run => run !== null);
}

export async function liveRunForGroup(
  client: SupabaseClient,
  groupId: string,
): Promise<Run | null> {
  const runs = await liveRuns(client);
  return runs.find((run) => run.groupId === groupId) ?? null;
}

interface ResultRow {
  beat_index: number;
  winning_choice: string;
  tally: Tally;
  decided_by_leader: boolean;
}

/**
 * The state a screen server-renders from.
 *
 * Every surface loads this before any realtime connection exists, which is
 * what makes a refresh a working fallback rather than a last resort: a leader
 * whose wifi has dropped the subscription can still drive the meeting.
 */
export async function roomState(
  client: SupabaseClient,
  run: Run,
): Promise<RoomState> {
  const { data, error } = await client
    .from("beat_results")
    .select("beat_index, winning_choice, tally, decided_by_leader")
    .eq("run_id", run.id)
    .order("beat_index", { ascending: true });
  if (error) throw error;

  const results: BeatResult[] = (data as ResultRow[]).map((row) => ({
    beatIndex: row.beat_index,
    winningChoice: row.winning_choice,
    tally: row.tally,
    decidedByLeader: row.decided_by_leader,
  }));

  return {
    runId: run.id,
    scenarioId: run.scenarioId,
    state: run.state,
    currentBeat: run.currentBeat,
    results,
    tie: run.tie,
  };
}

/** How many people are in the room, as the denominator for the live count. */
export async function memberCount(
  client: SupabaseClient,
  groupId: string,
): Promise<number> {
  const { count, error } = await client
    .from("memberships")
    .select("profile_id", { count: "exact", head: true })
    .eq("group_id", groupId);
  if (error) throw error;
  return count ?? 0;
}

/** The caller's own vote on a beat, so a phone can show what it chose. */
export async function ownVote(
  client: SupabaseClient,
  runId: string,
  beatIndex: number,
): Promise<string | null> {
  const { data, error } = await client
    .from("votes")
    .select("choice_key")
    .eq("run_id", runId)
    .eq("beat_index", beatIndex)
    .maybeSingle();
  if (error) throw error;
  return data ? ((data as { choice_key: string }).choice_key ?? null) : null;
}
