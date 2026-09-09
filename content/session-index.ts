/**
 * What a client component is allowed to know about the curriculum.
 *
 * The navigation rail and the breadcrumb are client components: whatever they
 * import is downloaded by every browser that opens a prep page. Importing
 * `sessions` for two fields costs the whole curriculum — a hundred kilobytes of
 * teaching notes, slides, and case studies that nothing on the page renders —
 * and after phase 7 it cost the ten scenarios on top of that.
 *
 * So these are literals rather than projections of `sessions` and `scenarios`,
 * because a projection would pull the modules in again through the back door.
 * `tests/content.test.ts` asserts they agree exactly, so they cannot drift
 * without a red build.
 */
export interface SessionHeading {
  number: number;
  title: string;
}

export const sessionIndex: readonly SessionHeading[] = [
  { number: 1, title: "Press Start" },
  { number: 2, title: "Made to Make, Made to Play" },
  { number: 3, title: "From the Garden to the Console" },
  { number: 4, title: "What Am I Becoming?" },
  { number: 5, title: "Time, Rest, and the Sabbath Question" },
  { number: 6, title: "Desire by Design" },
  { number: 7, title: "Violence, Story, and What We Behold" },
  { number: 8, title: "Avatars and the Anonymous Self" },
  { number: 9, title: "Guilds, Clans, and the Body" },
  { number: 10, title: "Play as Mission" },
];

/** The same rule for the show-of-hands decks: an id and a name to click. */
export interface DeckHeading {
  id: string;
  caseTitle: string;
}

export const deckIndex: readonly DeckHeading[] = [
  { id: "s1-delete-the-library", caseTitle: "Delete the Library?" },
  { id: "s2-the-hobby-developer", caseTitle: "The Hobby Developer" },
  { id: "s3-the-ministry-server", caseTitle: "The Ministry Server" },
  { id: "s4-ellas-short-fuse", caseTitle: "Ella's Short Fuse" },
  { id: "s5-third-shift", caseTitle: "Third Shift" },
  { id: "s6-four-hundred-dollars", caseTitle: "Four Hundred Dollars" },
  { id: "s7-the-split", caseTitle: "The Split" },
  { id: "s8-two-names", caseTitle: "Two Names" },
  { id: "s9-he-isnt-wrong", caseTitle: "He Isn't Wrong" },
  { id: "s10-the-lobby", caseTitle: "The Lobby" },
];
