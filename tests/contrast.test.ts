import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The palette's small-text colours meet WCAG AA.
 *
 * The ported tokens — `--ink-faint`, `--brass`, `--on-violet-faint` — do not,
 * at the sizes this curriculum sets small print, so `app/globals.css` defines
 * legible siblings for text and keeps the originals for rules, borders, and the
 * focus ring. This test is what stops a later palette tweak from quietly
 * undoing that; the end-to-end suite runs axe over the rendered pages, but a
 * failure here names the token rather than the element.
 */
const css = readFileSync("app/globals.css", "utf8");

function token(name: string): string {
  const match = new RegExp(`\\s${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match?.[1])
    throw new Error(`No literal value for ${name} in app/globals.css`);
  return match[1];
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((offset) =>
    channel(parseInt(hex.slice(offset, offset + 2), 16)),
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3;

describe("small text meets WCAG AA", () => {
  const cases: [string, string, string][] = [
    ["--ink-faint-legible", "--page", "muted prose on the page"],
    ["--ink-faint-legible", "--surface", "muted prose on a card"],
    ["--ink-faint-legible", "--vellum", "muted prose on a scripture card"],
    ["--brass-legible", "--page", "references and counters on the page"],
    ["--brass-legible", "--surface", "references on a card"],
    ["--brass-legible", "--vellum", "the anchor reference on its card"],
    ["--brass-ink", "--brass-lite", "the question counter chip"],
    ["--brass-ink-soft", "--page", "the christian lean label"],
    ["--brass-on-violet", "--violet-deep", "session numbers in the rail"],
    [
      "--on-violet-faint-legible",
      "--violet-deep",
      "rail labels and the rail footer",
    ],
    ["--on-violet-soft", "--violet-deep", "rail links"],
    ["--teal", "--page", "links in prose"],
    ["--ink-soft", "--page", "body prose"],
    ["--ink", "--page", "headings"],
    ["--clay-ink", "--clay-lite", "pastoral-care notes"],
  ];

  it.each(cases)("%s on %s — %s", (foreground, background) => {
    expect(
      contrast(token(foreground), token(background)),
    ).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe("the ported tokens keep their non-text role", () => {
  // They are the focus ring, the rules, and the semester-track gradient, which
  // WCAG holds to 3:1 rather than 4.5:1. They pass that, which is why they can
  // stay exactly as the original authored them.
  it.each([
    ["--brass", "--page", "the focus ring"],
    ["--brass", "--surface", "the focus ring over a card"],
  ])("%s on %s — %s", (foreground, background) => {
    expect(
      contrast(token(foreground), token(background)),
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});
