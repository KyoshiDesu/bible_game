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
  type Connection,
  type RoomClient,
  type RoomController,
  type RoomResult,
  type RoomState,
  type Tie,
  type Unsubscribe,
  type VoteResult,
} from "./client";
import { type RunState, type Tally } from "./machine";

interface RunRow {
  id: string;
  scenario_id: string;
  state: RunState;
  current_beat: number;
  tie: Tie | null;
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

/**
 * A channel's status, as something to show a leader.
 *
 * `CLOSED` counts as lost rather than as an orderly shutdown: by the time a
 * screen sees it mid-meeting, whatever closed the socket was not the leader.
 */
function statusToConnection(status: string): Connection {
  switch (status) {
    case "SUBSCRIBED":
      return "live";
    case "CHANNEL_ERROR":
    case "TIMED_OUT":
    case "CLOSED":
      return "lost";
    default:
      return "connecting";
  }
}

export function supabaseRoom(
  client: SupabaseClient,
): RoomClient & RoomController {
  async function getState(runId: string): Promise<RoomState> {
    const [run, results] = await Promise.all([
      client
        .from("scenario_runs")
        .select("id, scenario_id, state, current_beat, tie")
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
      tie: row.tie,
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

    subscribe(runId, onChange, onConnection) {
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
        .subscribe((status) => {
          onConnection?.(statusToConnection(status));
        });

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

/** What the database broadcasts while a beat is open. Never a split. */
export interface VoteCount {
  beatIndex: number;
  voted: number;
  /** How many are in the group, read at the moment of the vote. */
  members: number;
}

export interface CountHandlers {
  onCount(count: VoteCount): void;
  /** How many people are on the channel, the leader included. */
  onPresence(present: number): void;
  onConnection?(connection: Connection): void;
}

/**
 * Reads a count out of whatever the channel delivered.
 *
 * This is the one place in the live session where data arrives without having
 * come back through a typed query, so it is a boundary rather than a helper: a
 * message that does not look like a count is ignored rather than rendered,
 * because a wrong number on a projector is worse than no number.
 */
export function parseVoteCount(payload: unknown): VoteCount | null {
  const body =
    payload && typeof payload === "object" && "payload" in payload
      ? (payload as { payload: unknown }).payload
      : payload;
  if (!body || typeof body !== "object") return null;

  const { beatIndex, voted, members } = body as Record<string, unknown>;
  return typeof beatIndex === "number" &&
    typeof voted === "number" &&
    typeof members === "number"
    ? { beatIndex, voted, members }
    : null;
}

/**
 * The best-effort channels: how many have voted, and who is here.
 *
 * Separate from `subscribe` on purpose. State transitions ride Postgres
 * Changes and are derived from committed rows, so a missed message costs
 * nothing once a client refetches. These are aggregates, and losing them costs
 * a number on a screen — so they are allowed to fail on their own without
 * taking the reliable channel down with them.
 *
 * Two topics rather than one, because Realtime authorises presence as a write:
 * announcing that you are here is saying something. Counts live on a topic no
 * client can write to at all, so nothing on the projector can be forged.
 * Presence lives on its own topic that members may write to, and nothing
 * listens for broadcast events there — so the write it needs buys a member
 * exactly the ability to be counted as present.
 */
export function watchCounts(
  client: SupabaseClient,
  runId: string,
  presenceKey: string,
  handlers: CountHandlers,
): Unsubscribe {
  const counts = client.channel(`room:${runId}`, {
    config: { private: true },
  });

  counts
    .on("broadcast", { event: "count" }, (message) => {
      const count = parseVoteCount(message.payload);
      if (count) handlers.onCount(count);
    })
    .subscribe((status) => {
      handlers.onConnection?.(statusToConnection(status));
    });

  const presence = client.channel(`presence:${runId}`, {
    config: { private: true, presence: { key: presenceKey } },
  });

  presence
    .on("presence", { event: "sync" }, () => {
      handlers.onPresence(Object.keys(presence.presenceState()).length);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") void presence.track({ runId });
    });

  return () => {
    void client.removeChannel(counts);
    void client.removeChannel(presence);
  };
}
