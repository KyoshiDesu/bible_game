import { expect, test } from "@playwright/test";

import { session01Scenario as scenario } from "../content/scenarios/session-01";

import { pressUntil, settled, violations } from "./browser";

/**
 * The projector's palette and type, checked where they can be checked without
 * a database.
 *
 * The show-of-hands deck is the presenter view's own components on the
 * presenter view's own dark surfaces, and it renders statically — so it is the
 * page that can carry the read-at-distance case through axe on every pull
 * request rather than only when a Supabase is running.
 */
test("the deck has no accessibility violations, on either slide", async ({
  page,
}) => {
  await page.goto(`/deck/${scenario.id}`);
  await expect(
    page.getByRole("heading", { name: scenario.caseTitle }),
  ).toBeVisible();
  await settled(page);
  expect(await violations(page)).toEqual([]);

  await pressUntil(
    page,
    "ArrowRight",
    page.getByText(scenario.beats[0]!.prompt),
  );
  await settled(page);
  expect(await violations(page)).toEqual([]);
});

test("the deck is driven from a clicker and nothing else", async ({ page }) => {
  await page.goto(`/deck/${scenario.id}`);

  // PageDown and PageUp are what a presentation remote actually sends.
  const first = scenario.beats[0]!;
  await pressUntil(page, "PageDown", page.getByText(first.prompt));

  await page.keyboard.press("PageUp");
  await expect(
    page.getByRole("heading", { name: scenario.caseTitle }),
  ).toBeVisible();
});

test.describe("with prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a slide arrives without moving", async ({ page }) => {
    await page.goto(`/deck/${scenario.id}`);

    // The reveal is information rather than decoration, so it still happens —
    // it just stops being a movement. The global reduced-motion rule collapses
    // it, and this is the assertion that the rule reaches the presenter's own
    // animation rather than only the ones inherited from the prep surface.
    const seconds = await page
      .locator("main section")
      .first()
      .evaluate((element) =>
        parseFloat(getComputedStyle(element).animationDuration),
      );
    expect(seconds).toBeLessThan(0.001);

    await expect(
      page.getByRole("heading", { name: scenario.caseTitle }),
    ).toBeVisible();
  });
});
