import { describe, expect, it } from "vitest";

import {
  isScriptureReference,
  parseScriptureReference,
  SCRIPTURE_BOOKS,
} from "@/lib/scripture";

describe("references the curriculum actually uses", () => {
  it.each([
    "1 Corinthians 10:23-24, 31",
    "Genesis 1:27-28",
    "Genesis 2:15",
    "Zechariah 8:5",
    "Exodus 35:30-35",
    "Proverbs 8:30-31",
    "Colossians 4:5-6",
    "1 Peter 3:15",
    "Matthew 5:16",
    "Luke 12:2-3",
    "Romans 12:2",
    "Psalm 23",
    // Single-chapter books are cited by verse alone.
    "3 John 13-14",
    "Jude 3",
    "Philemon 8-9",
  ])("parses %s", (reference) => {
    expect(isScriptureReference(reference)).toBe(true);
  });

  it("keeps the book and the location apart", () => {
    expect(parseScriptureReference("1 Corinthians 10:23-24, 31")).toEqual({
      book: "1 Corinthians",
      location: "10:23-24, 31",
    });
  });

  it("reads the longest book name, not the first that matches", () => {
    expect(parseScriptureReference("1 John 2:15")?.book).toBe("1 John");
    expect(parseScriptureReference("Song of Solomon 2:1")?.book).toBe(
      "Song of Solomon",
    );
  });
});

describe("what it refuses", () => {
  it.each([
    ["1 Corinthans 10:23", "a misspelt book"],
    ["Hezekiah 3:4", "a book that is not in the Bible"],
    ["John", "a book with no chapter"],
    ["John chapter three", "a location that is not numbers"],
    ["Genesis 1:1:1", "a location that will not parse"],
    ["", "nothing at all"],
  ])("refuses %s — %s", (reference) => {
    expect(isScriptureReference(reference)).toBe(false);
  });
});

describe("the book list", () => {
  it("has the sixty-six, plus the two spellings of Psalms", () => {
    expect(SCRIPTURE_BOOKS).toHaveLength(68);
    expect(new Set(SCRIPTURE_BOOKS).size).toBe(SCRIPTURE_BOOKS.length);
  });
});
