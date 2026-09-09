import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Deck } from "@/components/present/deck";
import { scenarios } from "@/content";
import { type Scenario } from "@/content/scenario-schema";

/**
 * Leader notes are never projected.
 *
 * `leaderNote` is what the leader should draw out of the room, and the
 * projector is pointed at the room. With ten scenarios there are a hundred and
 * twenty of them, and the way this breaks is not a bad decision — it is
 * somebody adding a field to a slide without thinking about which fields are
 * for whom.
 *
 * So this walks every scenario all the way through the deck, one beat at a
 * time, and reads the screen at every stage.
 */
function plain(html: string): string {
  // Tags come out to nothing rather than to a space, because that is what the
  // DOM does with them: `<i>ok</i>,` reads as "ok," on screen, and stripping
  // to a space would leave a gap before the comma that no reader ever sees.
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Everything the room would have seen, from the premise to the closing. */
function everythingShown(scenario: Scenario): string {
  const seen: string[] = [];
  const capture = () => seen.push(document.body.textContent ?? "");
  const press = (key: string) => fireEvent.keyDown(window, { key });

  render(<Deck scenario={scenario} />);
  capture();

  for (const beat of scenario.beats) {
    press("ArrowRight");
    capture();
    // Every choice's own consequence slide, not only the one a leader picked:
    // a note leaks on the slide it belongs to, so all of them get looked at.
    for (let choice = 0; choice < beat.choices.length; choice++) {
      press(String(choice + 1));
      capture();
      press("ArrowLeft");
    }
    press("1");
  }
  press("ArrowRight");
  capture();

  return seen.join("   ").replace(/\s+/g, " ");
}

afterEach(cleanup);

describe.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
  "%s",
  (_id, scenario) => {
    it("never puts a leader's note on the projector", () => {
      const shown = everythingShown(scenario);

      for (const beat of scenario.beats) {
        for (const choice of beat.choices) {
          expect(
            shown.includes(plain(choice.leaderNote)),
            `beat ${beat.index}, choice ${choice.key}`,
          ).toBe(false);
        }
      }
      expect(shown.includes(plain(scenario.closing.leaderKey))).toBe(false);
    });

    it("does put every consequence the room could reach on it", () => {
      // The other half of the same check: if the walk above never reached a
      // slide, its note would trivially be absent and this test would prove
      // nothing at all.
      const shown = everythingShown(scenario);

      for (const beat of scenario.beats) {
        for (const choice of beat.choices) {
          expect(
            shown.includes(plain(choice.consequence)),
            `beat ${beat.index}, choice ${choice.key}`,
          ).toBe(true);
        }
      }
    });
  },
);
