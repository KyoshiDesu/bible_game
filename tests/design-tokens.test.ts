import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/*
 * The application's palette is a port of the one in the original single-file
 * curriculum. This test is the thing that keeps it a port rather than a
 * lookalike: if a colour drifts in either file, the build says so.
 *
 * When the source HTML is eventually retired (phase 1 extracts its content),
 * this test goes with it — but not before.
 */

const root = join(__dirname, "..");

function rootBlock(css: string, selector: string): string {
  const start = css.indexOf(selector);
  expect(start, `${selector} not found`).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function customProperties(block: string): Map<string, string> {
  const found = new Map<string, string>();
  const declarations = block.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const line of declarations.split(";")) {
    const match = /^\s*(--[\w-]+)\s*:\s*(.+)$/s.exec(line);
    if (match?.[1] && match[2]) {
      found.set(match[1], match[2].trim().replace(/\s+/g, " "));
    }
  }
  return found;
}

const source = customProperties(
  rootBlock(
    readFileSync(join(root, "press-start-curriculum.html"), "utf8"),
    ":root{",
  ),
);
const ported = customProperties(
  rootBlock(readFileSync(join(root, "app", "globals.css"), "utf8"), ":root {"),
);

const COLOUR_TOKENS = [
  "--ink",
  "--ink-soft",
  "--ink-faint",
  "--violet-deep",
  "--violet-mid",
  "--page",
  "--surface",
  "--surface-2",
  "--brass",
  "--brass-lite",
  "--teal",
  "--teal-lite",
  "--clay",
  "--clay-lite",
  "--vellum",
  "--rule",
] as const;

describe("design tokens", () => {
  it("reads every colour token out of the source file", () => {
    // Guards the parser itself: an empty parse would make the suite below
    // pass vacuously.
    expect(source.size).toBeGreaterThanOrEqual(COLOUR_TOKENS.length);
  });

  it.each(COLOUR_TOKENS)("ports %s unchanged", (token) => {
    const expected = source.get(token);
    expect(expected, `${token} missing from the source file`).toBeDefined();
    expect(ported.get(token)?.toLowerCase()).toBe(expected?.toLowerCase());
  });

  it("ports the card shadow", () => {
    const expected = source.get("--shadow");
    expect(expected).toBeDefined();
    // Ignore whitespace and the leading zero the source omits (".06").
    const normalise = (value: string) =>
      value
        .replace(/\s+/g, "")
        .replace(/(^|[^\d])0\./g, "$1.")
        .toLowerCase();
    expect(normalise(ported.get("--shadow-press") ?? "")).toBe(
      normalise(expected ?? ""),
    );
  });

  it("keeps the three font stacks, with next/font in front", () => {
    const theme = customProperties(
      rootBlock(
        readFileSync(join(root, "app", "globals.css"), "utf8"),
        "@theme inline {",
      ),
    );

    for (const [themeToken, sourceToken, nextFontVar] of [
      ["--font-sans", "--sans", "--font-karla"],
      ["--font-serif", "--serif", "--font-fraunces"],
      ["--font-mono", "--mono", "--font-plex-mono"],
    ] as const) {
      const stack = theme.get(themeToken);
      expect(stack, `${themeToken} missing`).toBeDefined();
      expect(stack).toContain(`var(${nextFontVar})`);

      // Every fallback the original named is still a fallback here.
      const fallbacks = (source.get(sourceToken) ?? "")
        .split(",")
        .slice(1)
        .map((family) => family.trim());
      expect(fallbacks.length).toBeGreaterThan(0);
      for (const family of fallbacks) {
        expect(stack).toContain(family);
      }
    }
  });
});
