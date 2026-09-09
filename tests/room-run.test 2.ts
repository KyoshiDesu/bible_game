import { describe, expect, it } from "vitest";

import { session01Scenario } from "@/content/scenarios/session-01";
import { type RoomState } from "@/lib/room/client";
import { FakeRoom } from "@/lib/room/fake";

/**
 * A whole scenario played through, with no UI and no network.
 *
 * This is the phase's other acceptance criterion, and it is worth more than it
 * looks: it is the first time the machine, the fake, and a real authored
 * scenario meet, and it runs in milliseconds, so it can be run on every change.
 */
const scenario = session01Scenario;
const RUN = "run-1";

function keys(beatIndex: number): string[] {
  return scenario.beats[beatIndex]!.choices.map((choice) => choice.key);
}

describe("a session played end to end", () => {
  it("runs every beat, reveals every result, and completes", async () => {
    const room = new FakeRoom(scenario, RUN);
    const seen: RoomState[] = [];
    const stop = room.subscribe(RUN, (state) => seen.push(state));

    expect((await room.getState()).state).toBe("idle");
    expect((await room.open()).ok).toBe(true);

    for (const beat of scenario.beats) {
      const state = await room.getState();
      expect(state).toMatchObject({ state: "voting", currentBeat: beat.index });

      // A room of twelve, most of them agreeing.
      const [first, second] = keys(beat.index);
      for (let person = 0; person < 12; person++) {
        const choice = person < 7 ? first! : second!;
        expect(room.voteAs(`person-${person}`, beat.index, choice)).toEqual({
          ok: true,
        });
      }
      expect(room.liveCount(beat.index)).toBe(12);

      expect((await room.close(RUN, keys(beat.index))).ok).toBe(true);
      expect((await room.getState()).state).toBe("revealing");
      expect((await room.advance()).ok).toBe(true);
    }

    const final = await room.getState();
    expect(final.state).toBe("complete");
    expect(final.results).toHaveLength(scenario.beats.length);
    expect(final.results.every((result) => !result.decidedByLeader)).toBe(true);

    // Every screen in the building watches the same thing change.
    expect(seen.length).toBeGreaterThan(scenario.beats.length * 2);
    expect(seen.at(-1)).toEqual(final);
    stop();
  });

  it("hands a split room to the leader and carries on", async () => {
    const room = new FakeRoom(scenario, RUN);
    await room.open();

    const [a, b] = keys(0);
    room.voteAs("one", 0, a!);
    room.voteAs("two", 0, b!);

    expect((await room.close(RUN, keys(0))).ok).toBe(true);
    expect((await room.getState()).state).toBe("tied");
    // Nothing is written until the leader decides.
    expect((await room.getState()).results).toEqual([]);

    const wrong = await room.breakTie(RUN, keys(0)[2]!, keys(0));
    expect(wrong).toMatchObject({ ok: false });
    if (!wrong.ok) expect(wrong.reason).toContain("tied on");

    expect((await room.breakTie(RUN, b!, keys(0))).ok).toBe(true);
    const state = await room.getState();
    expect(state.state).toBe("revealing");
    expect(state.results).toEqual([
      {
        beatIndex: 0,
        winningChoice: b,
        tally: { a: 1, b: 1, c: 0, d: 0 },
        decidedByLeader: true,
      },
    ]);
  });

  it("refuses a vote that is not for the open beat", async () => {
    const room = new FakeRoom(scenario, RUN);
    expect(room.voteAs("early", 0, "a")).toMatchObject({ ok: false });

    await room.open();
    expect(room.voteAs("ahead", 1, "a")).toMatchObject({ ok: false });
    expect(room.voteAs("here", 0, "z")).toMatchObject({ ok: false });
    expect(room.voteAs("here", 0, "a")).toEqual({ ok: true });
  });

  it("lets someone change their mind while the vote is open, and not after", async () => {
    const room = new FakeRoom(scenario, RUN);
    await room.open();

    room.voteAs("mind", 0, "a");
    room.voteAs("mind", 0, "d");
    expect(room.liveCount(0)).toBe(1);

    await room.close(RUN, keys(0));
    expect(room.voteAs("mind", 0, "a")).toMatchObject({ ok: false });
    expect((await room.getState()).results[0]?.winningChoice).toBe("d");
  });

  it("treats a room that said nothing as a tie for the leader to settle", async () => {
    const room = new FakeRoom(scenario, RUN);
    await room.open();
    await room.close(RUN, keys(0));
    expect((await room.getState()).state).toBe("tied");
  });
});
