/**
 * The room, over Supabase.
 *
 * Two channels, deliberately different in reliability. State transitions ride
 * Postgres Changes on `scenario_runs` and are derived from committed data, so a
 * client that drops and refetches gets the identical answer — which is why
 * there is no replay log anywhere in this file. Live vote counts ride a
 * broadcast channel and are best-effort: "12 of 15 voted" being half a second
 * stale costs nothing.
 *
 * A change notification here is only a nudge to refetch, never the new state
 * itself. Rendering from the payload would mean a client that missed a message
 * renders something no other screen agrees with, which is the whole failure
 * this design exists to avoid.
 */
import { type SupabaseClient } from "@supabase/supabase-js";

import {
  type BeatResult,
  type RoomClient,
  type RoomController,
  type RoomResult,
  type RoomState,
  type Unsubscribe,
  type VoteResult,
} from "./client";
import { type RunState, type Tally } from "./machine";

interface RunRow {
  id: string;
  scenario_id: string;
  state: RunState;
  current_beat: number;
}

interface ResultRow {
  beat_index: number;
  winning_choice: string;
  tally: Tally;
  decided_by_leader: boolean;
}

function toResult(row: ResultRow): BeatResult {
  return {
    beatIndex: row.beat_index,
    winningChoice: row.winning_choice,
    tally: row.tally,
    decidedByLeader: row.decided_by_leader,
  };
}

export function supabaseRoom(
  client: SupabaseClient,
): RoomClient & RoomController {
  async function getState(runId: string): Promise<RoomState> {
    const [run, results] = await Promise.all([
      client
        .from("scenario_runs")
        .select("id, scenario_id, state, current_beat")
        .eq("id", runId)
        .single(),
      client
        .from("beat_results")
        .select("beat_index, winning_choice, tally, decided_by_leader")
        .eq("run_id", runId)
        .order("beat_index", { ascending: true }),
    ]);

    if (run.error) throw run.error;
    if (results.error) throw results.error;

    const row = run.data as RunRow;
    return {
      runId: row.id,
      scenarioId: row.scenario_id,
      state: row.state,
      currentBeat: row.current_beat,
      results: (results.data as ResultRow[]).map(toResult),
    };
  }

  /** Wraps a transition RPC so a refusal is a value, not a thrown error. */
  async function drive(
    runId: string,
    // A postgrest builder is a thenable rather than a Promise.
    call: PromiseLike<{ error: { message: string } | null }>,
  ): Promise<RoomResult> {
    const { error } = await call;
    if (error) return { ok: false, reason: error.message };
    return { ok: true, state: await getState(runId) };
  }

  return {
    getState,

    subscribe(runId, onChange) {
      const channel = client
        .channel(`run:${runId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "scenario_runs",
            filter: `id=eq.${runId}`,
          },
          () => {
            void getState(runId).then(onChange);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "beat_results",
            filter: `run_id=eq.${runId}`,
          },
          () => {
            void getState(runId).then(onChange);
          },
        )
        .subscribe();

      const unsubscribe: Unsubscribe = () => {
        void client.removeChannel(channel);
      };
      return unsubscribe;
    },

    async vote(runId, beatIndex, choice): Promise<VoteResult> {
      const { error } = await client.rpc("cast_vote", {
        p_run_id: runId,
        p_beat: beatIndex,
        p_choice: choice,
      });
      return error ? { ok: false, reason: error.message } : { ok: true };
    },

    open(runId) {
      return drive(runId, client.rpc("open_vote", { p_run_id: runId }));
    },

    close(runId, choiceKeys) {
      return drive(
        runId,
        client.rpc("close_vote", {
          p_run_id: runId,
          p_choice_keys: choiceKeys,
        }),
      );
    },

    breakTie(runId, choice, choiceKeys) {
      return drive(
        runId,
        client.rpc("break_tie", {
          p_run_id: runId,
          p_choice: choice,
          p_choice_keys: choiceKeys,
        }),
      );
    },

    advance(runId, beatCount) {
      return drive(
        runId,
        client.rpc("advance_run", { p_run_id: runId, p_beat_count: beatCount }),
      );
    },
  };
}
