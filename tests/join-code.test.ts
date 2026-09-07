import { describe, expect, it } from "vitest";

import {
  generateJoinCode,
  isJoinCode,
  JOIN_CODE_ALPHABET,
  JOIN_CODE_LENGTH,
  normalizeJoinCode,
} from "@/lib/join-code";

describe("the alphabet", () => {
  it("drops every character that is misread aloud or on a phone", () => {
    for (const ambiguous of ["0", "O", "1", "I", "L"]) {
      expect(JOIN_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });

  it("is the 31 characters the design counts on", () => {
    expect(JOIN_CODE_ALPHABET).toHaveLength(31);
    expect(new Set(JOIN_CODE_ALPHABET).size).toBe(31);
    // 31^6 — the number that makes guessing pointless.
    expect(JOIN_CODE_ALPHABET.length ** JOIN_CODE_LENGTH).toBe(887_503_681);
  });
});

describe("generation", () => {
  it("produces codes of the right shape", () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      const code = generateJoinCode();
      expect(code).toHaveLength(JOIN_CODE_LENGTH);
      expect(isJoinCode(code)).toBe(true);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });

  it("does not favour the front of the alphabet", () => {
    // Folding a random byte with `%` would make the first 8 characters roughly
    // 4% more likely than the rest. Rejection sampling is what avoids that, and
    // this is the assertion that would notice if it were removed.
    const counts = new Map<string, number>();
    const samples = 4000;
    for (let attempt = 0; attempt < samples; attempt++) {
      for (const character of generateJoinCode()) {
        counts.set(character, (counts.get(character) ?? 0) + 1);
      }
    }

    expect(counts.size).toBe(JOIN_CODE_ALPHABET.length);
    const expected = (samples * JOIN_CODE_LENGTH) / JOIN_CODE_ALPHABET.length;
    for (const [character, count] of counts) {
      expect(
        Math.abs(count - expected) / expected,
        `${character} appeared ${count} times against an expectation of ${Math.round(expected)}`,
      ).toBeLessThan(0.25);
    }
  });

  it("does not repeat itself in any practical sense", () => {
    const codes = new Set(Array.from({ length: 2000 }, generateJoinCode));
    expect(codes.size).toBeGreaterThan(1990);
  });
});

describe("what someone types", () => {
  it("absorbs case and spacing, which are typos rather than mistakes", () => {
    expect(normalizeJoinCode(" abc234 ")).toBe("ABC234");
    expect(normalizeJoinCode("ab c2 34")).toBe("ABC234");
  });

  it("does not silently repair a character that is not in the alphabet", () => {
    // A leader reading "ABCO34" aloud has misread the code; turning the O into
    // a zero would be a guess, and the join should fail so they look again.
    expect(isJoinCode(normalizeJoinCode("abco34"))).toBe(false);
    expect(isJoinCode("ABC23")).toBe(false);
    expect(isJoinCode("ABC2345")).toBe(false);
  });
});
