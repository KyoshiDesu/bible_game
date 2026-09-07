import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** One page of each kind the prep surface produces. */
const PAGES = [
  { path: "/", name: "overview" },
  { path: "/sessions/1", name: "a session's lesson plan" },
  { path: "/sessions/1/slides", name: "a session's slides" },
  { path: "/sessions/1/scripture", name: "a session's scripture" },
  { path: "/sessions/1/cases", name: "a session's case studies" },
  { path: "/handbook", name: "the handbook" },
  { path: "/cases", name: "the case bank" },
  { path: "/sources", name: "sources" },
  { path: "/rule-of-play", name: "the worksheet" },
];

for (const target of PAGES) {
  test(`${target.name} has no accessibility violations`, async ({ page }) => {
    await page.goto(target.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations.map(
        (violation) => `${violation.id}: ${violation.help}`,
      ),
    ).toEqual([]);
  });
}

test("the first tab stop skips the rail and lands on the content", async ({
  page,
}) => {
  await page.goto("/sessions/1");

  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();

  await skip.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("the rail navigates by keyboard alone", async ({ page }) => {
  await page.goto("/");

  const rail = page.getByRole("navigation", { name: "Curriculum" });
  const link = rail.getByRole("link", { name: "Made to Make, Made to Play" });
  await link.focus();
  await expect(link).toBeFocused();
  await link.press("Enter");

  await expect(page).toHaveURL("/sessions/2");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Made to Make, Made to Play",
  );
  // The rail marks where you are, not just where you can go.
  await expect(
    page.getByRole("link", { name: "Made to Make, Made to Play" }),
  ).toHaveAttribute("aria-current", "page");
});

test("a session's panes are links, so one can be sent to someone", async ({
  page,
}) => {
  await page.goto("/sessions/1");

  const tabs = page.getByRole("navigation", { name: "Session sections" });
  await tabs.getByRole("link", { name: "Case studies" }).click();
  await expect(page).toHaveURL("/sessions/1/cases");
  await expect(page.getByText("Delete the Library?").first()).toBeVisible();

  // The pane survives a reload, which is the whole point of it being a route.
  await page.reload();
  await expect(page.getByText("Delete the Library?").first()).toBeVisible();
});

test("search finds a term and navigates to it from the keyboard", async ({
  page,
}) => {
  await page.goto("/");

  const box = page.getByRole("combobox", { name: "Search the curriculum" });
  await box.click();
  await box.fill("loot box");

  const results = page.getByRole("listbox", { name: "Search results" });
  await expect(results).toBeVisible();
  await expect(results.getByRole("option").first()).toBeVisible();

  // The first hit is preselected, so Enter alone follows it.
  const first = results.getByRole("option").first();
  await expect(first).toHaveAttribute("aria-selected", "true");

  await box.press("ArrowDown");
  await expect(first).toHaveAttribute("aria-selected", "false");
  await box.press("ArrowUp");

  await box.press("Enter");
  await expect(page).toHaveURL(/\/sessions\/6/);
});
