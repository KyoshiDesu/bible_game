import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

/**
 * The accessibility violations on a page, as sentences worth reading.
 *
 * The selector and axe's own summary are part of each message on purpose: a
 * bare rule name sends whoever reads the failure hunting through the page for
 * the element that broke it, which is exactly the moment a red build starts
 * getting ignored.
 */
export async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return results.violations.flatMap((violation) =>
    violation.nodes.map(
      (node) =>
        `${violation.id} at ${node.target.join(" ")}: ${node.failureSummary ?? violation.help}`,
    ),
  );
}

/**
 * Waits for every running animation to finish.
 *
 * The reveal fades a slide in over a third of a second, and a contrast check
 * that lands mid-fade measures a colour nobody ever reads. WCAG is about the
 * settled state; this is how the test looks at the settled state.
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState === "finished"),
  );
}

/**
 * Presses a key until the page reacts to it.
 *
 * A statically rendered page answers the first request long before React has
 * attached its listeners, so a key pressed the instant it loads can land on
 * nothing at all. A leader standing in front of a room presses it again; so
 * does this, rather than sleeping for a number somebody guessed.
 */
export async function pressUntil(
  page: Page,
  key: string,
  appears: Locator,
): Promise<void> {
  await expect(async () => {
    await page.keyboard.press(key);
    await expect(appears).toBeVisible({ timeout: 250 });
  }).toPass({ timeout: 15_000 });
}
