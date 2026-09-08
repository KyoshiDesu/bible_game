import { expect, test } from "@playwright/test";

import { signInAsLeader } from "./leader";

/**
 * The workbook, and the two policies it exists to keep.
 *
 * The row-level-security suite proves the leader cannot read a body from the
 * database. This proves the application never puts one in front of them either:
 * the engagement page is rendered and searched for the exact words a
 * participant wrote.
 *
 * Needs a local Supabase: `npx supabase start`.
 */
const REFLECTION =
  "I counted the hours this fortnight and the number was worse than I would say out loud.";
const RULE_SENTENCE = "That he plays like someone with somewhere to be.";

test("a workbook saves itself, stays private, and shows as a count to the leader", async ({
  browser,
  request,
}) => {
  const address = `workbook-${Date.now()}@example.test`;

  // --- the leader sets up a group ------------------------------------------
  const leaderContext = await browser.newContext();
  const leader = await leaderContext.newPage();
  await signInAsLeader(leader, request, address);
  await leader
    .getByLabel("What should the group call you?")
    .fill("Workbook Leader");
  await leader.getByRole("button", { name: "Save" }).click();
  await leader.getByLabel("Name this group").fill("Workbook group");
  await leader.getByRole("button", { name: "Create group" }).click();
  await expect(leader).toHaveURL(/\/groups\/[0-9a-f-]{36}$/);
  const groupUrl = leader.url();
  const code = (await leader.locator("p.font-mono").first().innerText()).trim();

  // --- Ada joins and writes -------------------------------------------------
  const adaContext = await browser.newContext();
  const ada = await adaContext.newPage();
  await ada.goto("/join");
  await ada.getByLabel("Join code").fill(code);
  await ada.getByLabel("Your name").fill("Ada");
  await ada.getByRole("button", { name: /^Join/ }).click();
  await expect(ada).toHaveURL(/\/me$/);

  await ada.getByRole("link", { name: "Workbook group" }).click();
  await ada
    .getByRole("link", { name: /Desire by Design|Session 06|06/ })
    .first()
    .click();
  await expect(ada).toHaveURL(/\/session\/\d+$/);
  await ada.goBack();

  await ada
    .getByRole("link", { name: /Counting the Cost|05/ })
    .first()
    .click();
  const reflection = ada.getByLabel("Anything you want to keep");
  await reflection.fill(REFLECTION);

  // Autosave, not a button: it saves on a pause and says so.
  await expect(ada.getByText("Saved", { exact: true })).toBeVisible();

  // --- and it is still there after the phone is closed ---------------------
  await ada.reload();
  await expect(ada.getByLabel("Anything you want to keep")).toHaveValue(
    REFLECTION,
  );

  // --- Ada writes a rule of play and shares it ------------------------------
  const workbookUrl = new URL(ada.url());
  const groupPath = workbookUrl.pathname.replace(/\/session\/\d+$/, "");
  await ada.goto(`${groupPath}/rule`);
  await ada
    .getByLabel("What I play")
    .fill("Nothing after 10:30 on a work night.");
  await ada
    .getByLabel("One sentence I would want said about how I play")
    .fill(RULE_SENTENCE);
  await ada.getByRole("button", { name: "Save my rule" }).click();
  await expect(ada.locator("form").getByRole("status")).toBeVisible();

  await expect(ada.getByText("Only you can read this")).toBeVisible();
  await ada.getByRole("button", { name: "Share it with my group" }).click();
  await expect(ada.getByText("Your group can read this")).toBeVisible();

  // --- Bo joins, and sees only what was offered ----------------------------
  const boContext = await browser.newContext();
  const bo = await boContext.newPage();
  await bo.goto("/join");
  await bo.getByLabel("Join code").fill(code);
  await bo.getByLabel("Your name").fill("Bo");
  await bo.getByRole("button", { name: /^Join/ }).click();
  await expect(bo).toHaveURL(/\/me$/);
  await bo.goto(`${groupPath}/shared`);

  await expect(bo.getByText(RULE_SENTENCE)).toBeVisible();
  await expect(bo.getByText("Ada")).toBeVisible();
  // Nothing of Ada's workbook, which was never shared and never can be.
  expect(await bo.content()).not.toContain(REFLECTION);

  // A member of one group cannot open another's workbook by guessing an id.
  await bo.goto("/me/00000000-0000-0000-0000-000000000000");
  await expect(bo.getByText(/could not be found/i).first()).toBeVisible();

  // --- the leader sees that, and only that ---------------------------------
  await leader.goto(`${groupUrl}/engagement`);
  await expect(
    leader.getByRole("heading", { name: "Who has written" }),
  ).toBeVisible();

  const row = leader.getByRole("row", { name: /Ada/ });
  await expect(row).toContainText("1");
  await expect(row).toContainText("Written");

  const page = await leader.content();
  expect(page).not.toContain(REFLECTION);
  expect(page).toContain("Ada");

  await leaderContext.close();
  await adaContext.close();
  await boContext.close();
});

test("a workbook is reached through membership, not through a URL", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // With no session at all, the way in is the join form rather than a workbook.
  await page.goto("/me/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/join$/);

  await context.close();
});
