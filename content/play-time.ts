/**
 * How long a scenario takes, in numbers.
 *
 * These live apart from `scenario-schema.ts` because that module imports Zod,
 * and the projector imports one of these to size a countdown. A client
 * component that reaches for a constant should not drag a validation library
 * onto a laptop in a church hall to get it.
 */

/** Read-aloud pace, in words per minute. */
export const WORDS_PER_MINUTE = 140;

/** How long a beat's vote is open, in seconds. */
export const SECONDS_PER_VOTE = 30;

/**
 * The budget a scenario has, in seconds.
 *
 * Twelve minutes: what the forty-minute session plan gives the case study.
 */
export const PLAY_TIME_BUDGET = 12 * 60;
