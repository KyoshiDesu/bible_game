/**
 * The room, behind an interface.
 *
 * Everything the live session needs from a backend is these two interfaces, so
 * the room logic can be driven with no network at all and the transport can be
 * replaced without touching a component. The design names this as the piece
 * most likely to need replacing, which is why it is the one most worth
 * isolating — nothing below mentions Supabase.
 */
import { type RunState, type Tally } from "./machine";

export interface BeatResult {
  beatIndex: number;
  winningChoice: string;
  /** Frozen when voting closed. Never recomputed. */
  tally: Tally;
  /** True when the room tied and the leader chose. */
  decidedByLeader: boolean;
}

/** Everything a screen needs to render itself from scratch. */
export interface RoomState {
  runId: string;
  scenarioId: string;
  state: RunState;
  currentBeat: number;
  /** Every beat resolved so far, oldest first. */
  results: BeatResult[];
}

export type RoomResult =
  { ok: true; state: RoomState } | { ok: false; reason: string };

export type VoteResult = { ok: true } | { ok: false; reason: string };

export type Unsubscribe = () => void;

/**
 * What a participant's phone needs. Read state, watch for changes, vote.
 *
 * There is no way to read anyone else's vote, and no way to report a count:
 * the tally reaches the room through the resolved beat, and counts are
 * broadcast by the server. No client is trusted to say what the room thinks.
 */
export interface RoomClient {
  getState(runId: string): Promise<RoomState>;
  subscribe(runId: string, onChange: (state: RoomState) => void): Unsubscribe;
  vote(runId: string, beatIndex: number, choice: string): Promise<VoteResult>;
}

/**
 * What the leader's controls need. Separate from RoomClient because these are
 * the four transitions, and nothing a participant holds should be able to
 * reach them.
 *
 * `choiceKeys` and `beatCount` are passed in because scenario content lives in
 * the repository rather than the database; the caller has the scenario.
 */
export interface RoomController {
  open(runId: string): Promise<RoomResult>;
  close(runId: string, choiceKeys: readonly string[]): Promise<RoomResult>;
  breakTie(
    runId: string,
    choice: string,
    choiceKeys: readonly string[],
  ): Promise<RoomResult>;
  advance(runId: string, beatCount: number): Promise<RoomResult>;
}
