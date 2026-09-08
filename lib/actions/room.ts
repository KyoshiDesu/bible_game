"use server";

import { revalidatePath } from "next/cache";

import { findScenario } from "@/content";
import { choiceKeys, type Scenario } from "@/content/scenario-schema";
import { findRun, roomState } from "@/lib/db/meetings";
import { beatAt } from "@/lib/room/machine";
import { supabaseRoom } from "@/lib/room/supabase";
import { createClient } from "@/lib/supabase/server";

import { type RoomState } from "@/lib/room/client";

/**
 * The leader's controls, and the participant's vote.
 *
 * These are server actions rather than calls from the browser to Supabase for
 * one reason: they have to work when the room's realtime connection does not.
 * A server action is an ordinary POST to the application, so a leader on bad
 * wifi can still open and close a vote and drive the meeting by refreshing —
 * degraded, but working, which is the difference between an awkward minute and
 * an abandoned session.
 *
 * They run as the caller, through their own session, so the database decides
 * what is allowed. Nothing here re-checks who leads the group: the moment this
 * file has an opinion about that there are two answers to the question and one
 * of them will drift.
 */
export type RoomActionResult =
  { ok: true; state: RoomState } | { ok: false; reason: string };

export type VoteActionResult = { ok: true } | { ok: false; reason: string };

const UNREACHABLE =
  "The session could not be reached. Refresh, and if that fails run this beat on a show of hands.";

/** The run, its scenario, and a room client — or the reason there is none. */
async function context(runId: string) {
  const supabase = await createClient();
  const run = await findRun(supabase, runId);
  if (!run) return { ok: false as const, reason: "That session is not open." };

  const scenario = findScenario(run.scenarioId);
  if (!scenario) {
    return {
      ok: false as const,
      reason: `This session is running ${run.scenarioId}, which is not in this version of the application.`,
    };
  }

  return {
    ok: true as const,
    supabase,
    run,
    scenario,
    room: supabaseRoom(supabase),
  };
}

/** Every choice the run's current beat offers, for the tally. */
function keysForCurrentBeat(scenario: Scenario, beatIndex: number): string[] {
  const beat = beatAt(scenario, beatIndex);
  return beat ? choiceKeys(beat) : [];
}

async function drive(
  runId: string,
  action: (
    ctx: Extract<Awaited<ReturnType<typeof context>>, { ok: true }>,
  ) => Promise<{ ok: true } | { ok: false; reason: string }>,
): Promise<RoomActionResult> {
  const ctx = await context(runId);
  if (!ctx.ok) return ctx;

  try {
    const result = await action(ctx);
    if (!result.ok) return result;
    const run = await findRun(ctx.supabase, runId);
    if (!run) return { ok: false, reason: "That session is not open." };
    return { ok: true, state: await roomState(ctx.supabase, run) };
  } catch {
    return { ok: false, reason: UNREACHABLE };
  }
}

export async function openVote(runId: string): Promise<RoomActionResult> {
  return drive(runId, ({ room }) => room.open(runId));
}

export async function closeVote(runId: string): Promise<RoomActionResult> {
  return drive(runId, ({ room, run, scenario }) =>
    room.close(runId, keysForCurrentBeat(scenario, run.currentBeat)),
  );
}

export async function breakTie(
  runId: string,
  choice: string,
): Promise<RoomActionResult> {
  return drive(runId, ({ room, run, scenario }) =>
    room.breakTie(runId, choice, keysForCurrentBeat(scenario, run.currentBeat)),
  );
}

export async function advanceRun(runId: string): Promise<RoomActionResult> {
  return drive(runId, ({ room, scenario }) =>
    room.advance(runId, scenario.beats.length),
  );
}

/** Re-reading the run, for a screen whose realtime connection has died. */
export async function refetchRoom(runId: string): Promise<RoomActionResult> {
  return drive(runId, () => Promise.resolve({ ok: true as const }));
}

/**
 * A vote.
 *
 * `cast_vote` takes a shared lock on the run before it looks at the state, so a
 * vote arriving while the leader is closing either lands before the tally is
 * taken or is refused after it. "Voting has closed" is the honest answer to the
 * second case and the one the participant sees.
 */
export async function castVote(
  runId: string,
  beatIndex: number,
  choice: string,
): Promise<VoteActionResult> {
  const ctx = await context(runId);
  if (!ctx.ok) return ctx;

  const beat = beatAt(ctx.scenario, beatIndex);
  if (!beat?.choices.some((candidate) => candidate.key === choice)) {
    return { ok: false, reason: "That is not one of the choices." };
  }

  try {
    return await ctx.room.vote(runId, beatIndex, choice);
  } catch {
    return { ok: false, reason: UNREACHABLE };
  }
}

// --------------------------------------------------------------- meetings

export type StartResult =
  { ok: true; runId: string } | { ok: false; reason: string };

export async function startMeeting(
  groupId: string,
  sessionNumber: number,
  scenarioId: string,
): Promise<StartResult> {
  const scenario = findScenario(scenarioId);
  if (!scenario || scenario.sessionNumber !== sessionNumber) {
    return { ok: false, reason: "There is no scenario for that session yet." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_meeting", {
    p_group_id: groupId,
    p_session_number: sessionNumber,
    p_scenario_id: scenarioId,
  });
  if (error) return { ok: false, reason: error.message };

  revalidatePath("/present");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/me");
  return { ok: true, runId: (data as { id: string }).id };
}

export async function endMeeting(
  meetingId: string,
  groupId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("end_meeting", {
    p_meeting_id: meetingId,
  });
  if (error) return { ok: false, reason: error.message };

  revalidatePath("/present");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/me");
  return { ok: true };
}
