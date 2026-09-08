/**
 * The room engine, as pure functions.
 *
 * Everything here is a function of state and input, with no database, no
 * network, and no clock. That is deliberate: the expensive failures in this
 * project — a tally that disagrees with the projector, a double-tap advancing
 * two beats, a tie resolved silently — are all decidable from state alone, and
 * they are cheaper to find here than in front of a room.
 *
 * The database enforces the same rules again under a row lock, because a pure
 * function cannot stop two requests racing. These are not duplicated checks so
 * much as the same rule stated where it can be tested and stated again where it
 * can be enforced.
 */
import { type Beat, type Scenario } from "@/content/scenario-schema";

/**
 *   idle → voting → revealing → voting → … → complete
 *                ↘ tied ↗
 */
export type RunState = "idle" | "voting" | "tied" | "revealing" | "complete";

export interface Run {
  state: RunState;
  /** Zero-based, and only meaningful once the run has left `idle`. */
  currentBeat: number;
}

export type RoomCommand =
  | { type: "open" }
  | { type: "close"; resolution: Resolution }
  | {
      type: "breakTie";
      choice: string;
      /** The choices that actually tied. The leader picks among them. */
      tied: readonly string[];
    }
  | { type: "advance" };

export type TransitionErrorCode =
  "illegal-transition" | "unknown-choice" | "choice-not-tied";

export type TransitionResult =
  | { ok: true; run: Run }
  | { ok: false; code: TransitionErrorCode; message: string };

function refuse(code: TransitionErrorCode, message: string): TransitionResult {
  return { ok: false, code, message };
}

/**
 * The next state, or a reason why not.
 *
 * A refusal is a value rather than an exception because these arrive from a
 * leader's thumb on a phone at the front of a room: a double-tap, a stale
 * second tab, a button pressed while the previous request was still in flight.
 * "Voting is already closed" is a sentence to show, not a stack trace.
 */
export function transition(
  run: Run,
  command: RoomCommand,
  scenario: Scenario,
): TransitionResult {
  switch (command.type) {
    case "open": {
      if (run.state !== "idle") {
        return refuse(
          "illegal-transition",
          `A run can only be opened from the start; this one is ${run.state}.`,
        );
      }
      return { ok: true, run: { state: "voting", currentBeat: 0 } };
    }

    case "close": {
      if (run.state !== "voting") {
        return refuse(
          "illegal-transition",
          run.state === "revealing" || run.state === "tied"
            ? "Voting is already closed."
            : `Voting is not open; this run is ${run.state}.`,
        );
      }
      return {
        ok: true,
        run: {
          state: command.resolution.kind === "winner" ? "revealing" : "tied",
          currentBeat: run.currentBeat,
        },
      };
    }

    case "breakTie": {
      if (run.state !== "tied") {
        return refuse(
          "illegal-transition",
          `There is no tie to break; this run is ${run.state}.`,
        );
      }
      const beat = beatAt(scenario, run.currentBeat);
      if (!beat) {
        return refuse(
          "illegal-transition",
          "That beat is not in this scenario.",
        );
      }
      if (!beat.choices.some((choice) => choice.key === command.choice)) {
        return refuse(
          "unknown-choice",
          "That is not one of this beat's choices.",
        );
      }
      // The leader breaks the tie between the options that tied. A split room
      // is the most interesting thing that can happen in a case study, and
      // overriding it with a fifth answer would throw that away.
      if (!command.tied.includes(command.choice)) {
        return refuse(
          "choice-not-tied",
          "Pick one of the options the room tied on.",
        );
      }
      return {
        ok: true,
        run: { state: "revealing", currentBeat: run.currentBeat },
      };
    }

    case "advance": {
      if (run.state !== "revealing") {
        return refuse(
          "illegal-transition",
          `Nothing has been revealed yet; this run is ${run.state}.`,
        );
      }
      const next = run.currentBeat + 1;
      return next >= scenario.beats.length
        ? { ok: true, run: { state: "complete", currentBeat: run.currentBeat } }
        : { ok: true, run: { state: "voting", currentBeat: next } };
    }
  }
}

export function beatAt(scenario: Scenario, index: number): Beat | undefined {
  return scenario.beats.find((beat) => beat.index === index);
}

export function isFinalBeat(run: Run, scenario: Scenario): boolean {
  return run.currentBeat >= scenario.beats.length - 1;
}

/** Whether a participant may cast a vote right now, for this beat. */
export function acceptsVote(run: Run, beatIndex: number): boolean {
  return run.state === "voting" && beatIndex === run.currentBeat;
}

// ------------------------------------------------------------------ tallying

export type Tally = Readonly<Record<string, number>>;

export type Resolution =
  | { kind: "winner"; winner: string; tally: Tally }
  | { kind: "tie"; tied: readonly string[]; tally: Tally };

/**
 * Counts votes for a beat, seeding every choice at zero.
 *
 * Seeding matters: a choice nobody picked has to appear in the tally as `0`
 * rather than be absent, or the projector shows three bars where the room saw
 * four options and someone in the room quietly concludes their vote was lost.
 *
 * Votes for a key this beat does not offer are ignored. The database rejects
 * those too; this is what makes the function safe to run over data that came
 * from anywhere.
 */
export function tallyVotes(
  votes: readonly { choiceKey: string }[],
  beat: Beat,
): Tally {
  const counts: Record<string, number> = {};
  for (const choice of beat.choices) counts[choice.key] = 0;
  for (const vote of votes) {
    const current = counts[vote.choiceKey];
    if (current !== undefined) counts[vote.choiceKey] = current + 1;
  }
  return counts;
}

/**
 * A winner, or the choices that tied.
 *
 * A tie is anything other than exactly one choice holding the maximum — which
 * includes the case where nobody voted at all, since every choice then holds a
 * maximum of zero. That is the right answer rather than a degenerate one: an
 * empty room has not chosen, and the leader deciding is exactly what should
 * happen next.
 */
export function resolveTally(tally: Tally): Resolution {
  const entries = Object.entries(tally);
  const highest = Math.max(...entries.map(([, count]) => count));
  const leaders = entries
    .filter(([, count]) => count === highest)
    .map(([key]) => key)
    .sort();

  return leaders.length === 1 && leaders[0] !== undefined
    ? { kind: "winner", winner: leaders[0], tally }
    : { kind: "tie", tied: leaders, tally };
}

export function resolveVotes(
  votes: readonly { choiceKey: string }[],
  beat: Beat,
): Resolution {
  return resolveTally(tallyVotes(votes, beat));
}
