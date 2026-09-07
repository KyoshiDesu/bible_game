import { expect, test } from "@playwright/test";

test("the application boots and renders in the curriculum's type", async ({
  page,
}) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { name: "Press Start", level: 1 });
  await expect(heading).toBeVisible();

  // next/font is wired up if the serif family resolves to Fraunces rather
  // than the Georgia fallback.
  const family = await heading.evaluate(
    (node) => getComputedStyle(node).fontFamily,
  );
  expect(family).toContain("Fraunces");
});

test("the ported palette reaches the DOM", async ({ page }) => {
  await page.goto("/");

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // --page, #F1EFF4.
  expect(background).toBe("rgb(241, 239, 244)");
});
