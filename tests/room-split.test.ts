import { describe, expect, it } from "vitest";

import { scenarios } from "@/content";
import { choiceKeys } from "@/content/scenario-schema";
import { resolveVotes } from "@/lib/room/machine";
import { splitFor } from "@/scripts/room-split";

/**
 * The simulated room, checked with the real resolver.
 *
 * The rehearsal exists so a leader meets a tie before a room does. A split
 * that rounds to eleven votes and a winner would send them into the meeting
 * having practised the wrong moment, and nothing else in the project would
 * notice — so the outcome is decided here by the same function the database
 * decides it with.
 */
const beats = scenarios.flatMap((scenario) =>
  scenario.beats.map(
    (beat) => [`${scenario.id} beat ${beat.index}`, beat] as const,
  ),
);

function ballotToVotes(ballot: readonly string[]) {
  return ballot.map((choiceKey) => ({ choiceKey }));
}

describe.each([3, 7, 12, 13])("a room of %i", (voters) => {
  it.each(beats)("%s divides without losing anybody", (_label, beat) => {
    const ballot = splitFor(beat, voters, false);
    expect(ballot).toHaveLength(voters);
    expect(new Set(ballot).size).toBeGreaterThan(1);
    for (const key of ballot) expect(choiceKeys(beat)).toContain(key);
  });

  it.each(beats)("%s comes back decided when it should", (_label, beat) => {
    const resolution = resolveVotes(
      ballotToVotes(splitFor(beat, voters, false)),
      beat,
    );
    expect(resolution.kind).toBe("winner");
  });

  it.each(beats)("%s comes back tied when it is asked to", (_label, beat) => {
    const resolution = resolveVotes(
      ballotToVotes(splitFor(beat, voters, true)),
      beat,
    );
    expect(resolution.kind).toBe("tie");
    if (resolution.kind === "tie") {
      // Two options level, not four at zero — an empty room ties too, and that
      // is not the moment anybody needs to rehearse.
      expect(resolution.tied).toHaveLength(2);
    }
  });
});
