import { choiceKeys, type Beat } from "@/content/scenario-schema";

/**
 * How a simulated room splits on a beat.
 *
 * Apart from the script that uses it because this is the part that can be
 * quietly wrong. A "tie" that rounds to eleven votes and a winner is worse than
 * no rehearsal at all: the leader practises the wrong moment and finds out in
 * front of the room. `tests/room-split.test.ts` runs it over every beat of
 * every scenario and checks the outcome with the same resolver the database
 * uses.
 */
export function splitFor(beat: Beat, voters: number, tie: boolean): string[] {
  const keys = choiceKeys(beat);
  const ballot: string[] = [];

  if (tie) {
    // Two options level at the top and the rest strictly below them, which is
    // what a split room looks like — not two options at six and the others at
    // nothing. A leftover voter is dropped rather than handed to one side: a
    // rehearsal where eleven of twelve voted and the beat genuinely tied is
    // worth more than one where twelve voted and it did not.
    const below = keys.length - 2;
    const eachBelow = below > 0 ? Math.floor(voters / (keys.length + 2)) : 0;
    const top = Math.floor((voters - eachBelow * below) / 2);

    for (let i = 0; i < top; i++) ballot.push(keys[0]!);
    for (let i = 0; i < top; i++) ballot.push(keys[1]!);
    for (const key of keys.slice(2)) {
      for (let i = 0; i < eachBelow; i++) ballot.push(key);
    }
    return ballot;
  }

  // Roughly 45 / 30 / 15 / 10, which is what a split room actually looks like.
  const weights = [0.45, 0.3, 0.15, 0.1];
  for (const [index, key] of keys.entries()) {
    const share = Math.round((weights[index] ?? 0) * voters);
    for (let i = 0; i < share; i++) ballot.push(key);
  }
  while (ballot.length < voters) ballot.push(keys[0]!);
  return ballot.slice(0, voters);
}
