import { describe, expect, it } from "vitest";

import { session01Scenario } from "@/content/scenarios/session-01";
import {
  acceptsVote,
  isFinalBeat,
  resolveTally,
  resolveVotes,
  tallyVotes,
  transition,
  type Resolution,
  type Run,
  type RoomCommand,
  type RunState,
} from "@/lib/room/machine";

const scenario = session01Scenario;
const firstBeat = scenario.beats[0]!;

const WINNER: Resolution = {
  kind: "winner",
  winner: "a",
  tally: { a: 2, b: 1 },
};
const TIE: Resolution = {
  kind: "tie",
  tied: ["a", "b"],
  tally: { a: 1, b: 1 },
};

function run(state: RunState, currentBeat = 0): Run {
  return { state, currentBeat };
}

describe("the legal path through a scenario", () => {
  it("opens, votes, reveals, advances, and completes", () => {
    let current: Run = run("idle");

    const opened = transition(current, { type: "open" }, scenario);
    expect(opened).toMatchObject({
      ok: true,
      run: { state: "voting", currentBeat: 0 },
    });
    current = (opened as { run: Run }).run;

    for (let beat = 0; beat < scenario.beats.length; beat++) {
      expect(current).toEqual({ state: "voting", currentBeat: beat });

      const closed = transition(
        current,
        { type: "close", resolution: WINNER },
        scenario,
      );
      expect(closed.ok).toBe(true);
      current = (closed as { run: Run }).run;
      expect(current.state).toBe("revealing");

      const advanced = transition(current, { type: "advance" }, scenario);
      expect(advanced.ok).toBe(true);
      current = (advanced as { run: Run }).run;
    }

    expect(current.state).toBe("complete");
    expect(current.currentBeat).toBe(scenario.beats.length - 1);
  });

  it("routes a tie through the leader rather than resolving it silently", () => {
    const tied = transition(
      run("voting"),
      { type: "close", resolution: TIE },
      scenario,
    );
    expect(tied).toMatchObject({
      ok: true,
      run: { state: "tied", currentBeat: 0 },
    });

    const broken = transition(
      run("tied"),
      { type: "breakTie", choice: "b", tied: ["a", "b"] },
      scenario,
    );
    expect(broken).toMatchObject({ ok: true, run: { state: "revealing" } });
  });
});

describe("every illegal transition is refused", () => {
  // The whole table, so that adding a state or a command without thinking about
  // the rest of the grid fails here rather than in a room.
  const states: RunState[] = [
    "idle",
    "voting",
    "tied",
    "revealing",
    "complete",
  ];
  const commands: RoomCommand[] = [
    { type: "open" },
    { type: "close", resolution: WINNER },
    { type: "breakTie", choice: "a", tied: ["a", "b"] },
    { type: "advance" },
  ];

  const legal: Record<RunState, RoomCommand["type"][]> = {
    idle: ["open"],
    voting: ["close"],
    tied: ["breakTie"],
    revealing: ["advance"],
    complete: [],
  };

  for (const state of states) {
    for (const command of commands) {
      const allowed = legal[state].includes(command.type);
      it(`${command.type} from ${state} is ${allowed ? "allowed" : "refused"}`, () => {
        const result = transition(run(state), command, scenario);
        expect(result.ok).toBe(allowed);
        if (!allowed && !result.ok) {
          expect(result.code).toBe("illegal-transition");
          expect(result.message.length).toBeGreaterThan(0);
        }
      });
    }
  }

  it("says voting is already closed rather than something a leader cannot act on", () => {
    const result = transition(
      run("revealing"),
      { type: "close", resolution: WINNER },
      scenario,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("Voting is already closed.");
  });
});

describe("breaking a tie", () => {
  it("refuses a choice this beat does not offer", () => {
    const result = transition(
      run("tied"),
      { type: "breakTie", choice: "z", tied: ["a", "b"] },
      scenario,
    );
    expect(result).toMatchObject({ ok: false, code: "unknown-choice" });
  });

  it("refuses a choice the room did not tie on", () => {
    const result = transition(
      run("tied"),
      { type: "breakTie", choice: "c", tied: ["a", "b"] },
      scenario,
    );
    expect(result).toMatchObject({ ok: false, code: "choice-not-tied" });
  });
});

describe("counting", () => {
  it("seeds every choice at zero, so an unpicked option still appears", () => {
    expect(tallyVotes([], firstBeat)).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });

  it("counts what was cast", () => {
    const votes = [{ choiceKey: "a" }, { choiceKey: "c" }, { choiceKey: "a" }];
    expect(tallyVotes(votes, firstBeat)).toEqual({ a: 2, b: 0, c: 1, d: 0 });
  });

  it("ignores a vote for a choice this beat does not offer", () => {
    expect(tallyVotes([{ choiceKey: "z" }], firstBeat)).toEqual({
      a: 0,
      b: 0,
      c: 0,
      d: 0,
    });
  });
});

describe("resolving", () => {
  it("finds a single winner", () => {
    expect(resolveTally({ a: 5, b: 2, c: 1 })).toMatchObject({
      kind: "winner",
      winner: "a",
    });
  });

  it("calls two at the top a tie", () => {
    expect(resolveTally({ a: 3, b: 3, c: 1 })).toMatchObject({
      kind: "tie",
      tied: ["a", "b"],
    });
  });

  it("calls a four-way split a tie, which is a room of twelve and four options", () => {
    expect(resolveTally({ a: 3, b: 3, c: 3, d: 3 })).toMatchObject({
      kind: "tie",
      tied: ["a", "b", "c", "d"],
    });
  });

  it("treats a room that did not vote as a tie, not a winner", () => {
    // Every choice holds a maximum of zero. An empty room has not chosen, and
    // handing that to the leader is the right answer rather than a degenerate
    // one.
    expect(resolveVotes([], firstBeat)).toMatchObject({
      kind: "tie",
      tied: ["a", "b", "c", "d"],
    });
  });

  it("orders the tied choices, so two screens agree on what they show", () => {
    expect(resolveTally({ d: 2, a: 2, c: 1 })).toMatchObject({
      tied: ["a", "d"],
    });
  });
});

describe("what a phone is allowed to do", () => {
  it("accepts a vote only for the open beat", () => {
    expect(acceptsVote(run("voting", 1), 1)).toBe(true);
    expect(acceptsVote(run("voting", 1), 0)).toBe(false);
    expect(acceptsVote(run("tied", 1), 1)).toBe(false);
    expect(acceptsVote(run("revealing", 1), 1)).toBe(false);
    expect(acceptsVote(run("complete", 1), 1)).toBe(false);
  });

  it("knows which beat is the last one", () => {
    expect(isFinalBeat(run("voting", 0), scenario)).toBe(false);
    expect(
      isFinalBeat(run("voting", scenario.beats.length - 1), scenario),
    ).toBe(true);
  });
});
