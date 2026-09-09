/**
 * Scripture references, checked.
 *
 * The design asks `content:check` to fail on a malformed reference, and this is
 * what that means in practice: a book the Bible does not contain, or a chapter
 * and verse that will not parse. It catches the typo — "1 Corinthans" — that
 * otherwise reaches a slide, or a link that quietly opens a search page for
 * nothing at all.
 *
 * It is not trying to know whether a verse exists. Zechariah 8:5 and Zechariah
 * 8:500 both parse; only the second is wrong, and no list here would catch it.
 */
const BOOKS = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalm",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Song of Songs",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
] as const;

export const SCRIPTURE_BOOKS: readonly string[] = BOOKS;

/**
 * Chapter, or chapter and verses, with ranges and lists:
 *   8:5   10:23-24, 31   1:26-28   35:30-35   12
 *
 * The leading range is for the five single-chapter books — Obadiah, Philemon,
 * 2 John, 3 John, Jude — which are cited by verse alone: "3 John 13-14".
 */
const LOCATION =
  /^\d+(\s*[-–]\s*\d+)?(:\d+(\s*[-–]\s*\d+)?)?(\s*,\s*\d+(\s*[-–]\s*\d+)?)*$/;

export interface ScriptureReference {
  book: string;
  location: string;
}

export function parseScriptureReference(
  reference: string,
): ScriptureReference | null {
  const trimmed = reference.trim();

  // Longest match first, so "1 John" is not read as "John" preceded by junk and
  // "Song of Solomon" is not read as a book called "Song".
  const book = [...BOOKS]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => trimmed.startsWith(`${candidate} `));
  if (!book) return null;

  const location = trimmed.slice(book.length).trim();
  if (!LOCATION.test(location)) return null;

  return { book, location };
}

export function isScriptureReference(reference: string): boolean {
  return parseScriptureReference(reference) !== null;
}
