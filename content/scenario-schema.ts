/**
 * Scenarios: the playable form of a session's case study.
 *
 * A scenario is read aloud from the projector while the room votes on a phone.
 * Two authoring rules from the design are enforced here rather than left to
 * review, because both are the difference between a case study and a quiz:
 *
 *   * Every beat has three or four choices.
 *   * Play time fits inside the twelve minutes the forty-minute plan gives the
 *     case study.
 *
 * Two more rules decide whether the mechanic works at all, and neither can be
 * checked here. They are the author review, and they are worth doing out loud
 * with the ten scenarios open in curriculum order:
 *
 *   * At least two choices per beat are genuinely defensible by a thoughtful
 *     Christian. A beat with one right answer and three wrong ones is a quiz,
 *     and a room can smell it in about four seconds.
 *   * Every choice's consequence lands the story where the next beat begins.
 *     This is the one that breaks silently: a consequence that ends the season,
 *     or withdraws the thing the next beat is about, leaves a room reading a
 *     situation that could not have happened. Nine of the first ten scenarios
 *     had one, and every one of them was invisible until the beats were read
 *     back to back.
 */
import { z } from "zod";

import { findTrustedHtmlViolations } from "@/lib/trusted-html";

import { SECONDS_PER_VOTE, WORDS_PER_MINUTE } from "./play-time";

const authored = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    for (const violation of findTrustedHtmlViolations(value)) {
      ctx.addIssue({ code: "custom", message: `trusted-html: ${violation}` });
    }
  });

const plain = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    if (value.includes("<")) {
      ctx.addIssue({ code: "custom", message: "markup in a plain-text field" });
    }
  });

export const choiceSchema = z.strictObject({
  /** Stable within a beat, and what a vote row stores. */
  key: z.string().regex(/^[a-z]$/),
  /** What appears on a phone. Short enough to read while twelve people wait. */
  label: plain.max(120),
  /** Revealed on the projector once voting closes. */
  consequence: authored,
  /** Never projected. What the leader should draw out. */
  leaderNote: authored,
});

export const beatSchema = z.strictObject({
  index: z.number().int().min(0),
  situation: authored,
  prompt: plain,
  choices: z.array(choiceSchema).min(3).max(4),
});

export const scenarioSchema = z.strictObject({
  id: z.string().regex(/^s\d{1,2}-[a-z0-9-]+$/),
  sessionNumber: z.number().int().min(1).max(10),
  caseTitle: plain,
  premise: authored,
  cast: z.array(z.strictObject({ name: plain, description: authored })).min(1),
  beats: z.array(beatSchema).min(3).max(4),
  closing: z.strictObject({
    consequence: authored,
    scriptureRefs: z.array(plain).min(1),
    leaderKey: authored,
  }),
});

export type Choice = z.infer<typeof choiceSchema>;
export type Beat = z.infer<typeof beatSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;

// The timing constants live in ./play-time, which imports nothing, so that a
// client component can read one without pulling Zod along with it. Re-exported
// here because this is where a reader looks for them.
export {
  WORDS_PER_MINUTE,
  SECONDS_PER_VOTE,
  PLAY_TIME_BUDGET,
} from "./play-time";

function words(...parts: string[]): number {
  return parts
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * A crude estimate, and deliberately so: everything the room hears, at reading
 * pace, plus the voting. It is not trying to be accurate — it is trying to
 * catch the drift that turns a twelve-minute case study into a twenty-minute
 * one, which nobody notices until it happens in front of a room.
 *
 * Leader notes and the leader's key are excluded: they are never read aloud.
 */
export function estimatePlaySeconds(scenario: Scenario): number {
  const spoken = words(
    scenario.premise,
    ...scenario.cast.map((member) => `${member.name} ${member.description}`),
    ...scenario.beats.flatMap((beat) => [
      beat.situation,
      beat.prompt,
      ...beat.choices.map((choice) => choice.label),
      // One consequence is revealed per beat, whichever the room picks.
      longestConsequence(beat.choices),
    ]),
    scenario.closing.consequence,
  );

  return (
    Math.round((spoken / WORDS_PER_MINUTE) * 60) +
    scenario.beats.length * SECONDS_PER_VOTE
  );
}

function longestConsequence(choices: readonly Choice[]): string {
  return choices.reduce(
    (longest, choice) =>
      choice.consequence.length > longest.length ? choice.consequence : longest,
    "",
  );
}

/** Every choice key a beat offers, for validating a vote. */
export function choiceKeys(beat: Beat): string[] {
  return beat.choices.map((choice) => choice.key);
}
