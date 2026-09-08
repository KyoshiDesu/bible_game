import { expect, test } from "@playwright/test";

import { createClient } from "@supabase/supabase-js";

import { signInAsLeader, supabase } from "./leader";

// The last test in this file spends the join allowance for this machine's
// address, so the file runs in order rather than in parallel.
test.describe.configure({ mode: "serial" });

test("a leader creates a group and a participant joins it with a code and a name", async ({
  browser,
  request,
}) => {
  const stamp = Date.now();
  const address = `leader-${stamp}@example.test`;

  // --- the leader, on a laptop ---------------------------------------------
  const leaderContext = await browser.newContext();
  const leader = await leaderContext.newPage();

  await signInAsLeader(leader, request, address);

  // First sign-in asks for a display name before anything else.
  await leader
    .getByLabel("What should the group call you?")
    .fill("Sam the Leader");
  await leader.getByRole("button", { name: "Save" }).click();

  await leader.getByLabel("Name this group").fill("Tuesday evening");
  await leader.getByRole("button", { name: "Create group" }).click();

  await expect(leader).toHaveURL(/\/groups\/[0-9a-f-]{36}$/);
  await expect(
    leader.getByRole("heading", { name: "Tuesday evening" }),
  ).toBeVisible();

  const groupUrl = leader.url();
  const code = (await leader.locator("p.font-mono").first().innerText()).trim();
  expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);

  // --- the participant, on a phone, in the room ----------------------------
  const participantContext = await browser.newContext();
  const participant = await participantContext.newPage();

  await participant.goto("/join");
  await participant.getByLabel("Join code").fill(code.toLowerCase());
  await participant.getByLabel("Your name").fill("Ada");
  await participant.getByRole("button", { name: "Join" }).click();

  await expect(participant).toHaveURL(/\/me$/);
  await expect(participant.getByRole("heading", { name: "Ada" })).toBeVisible();
  await expect(participant.getByText("Tuesday evening")).toBeVisible();

  // No email and no password were ever asked for.
  await expect(participant.getByText("Keep what you write")).toBeVisible();

  // --- and the leader sees them --------------------------------------------
  await leader.goto(groupUrl);
  await expect(leader.getByText("Ada", { exact: true })).toBeVisible();
  await expect(
    leader.getByRole("heading", { name: /Who has joined \(2\)/ }),
  ).toBeVisible();

  await leaderContext.close();
  await participantContext.close();
});

test("a wrong code is refused, and refused the same way every time", async ({
  page,
}) => {
  await page.goto("/join");
  // Scoped to the form: Next renders its own live region with role="alert".
  const alert = page.locator("form").getByRole("alert");
  const join = page.getByRole("button", { name: /^Join/ });
  await page.getByLabel("Your name").fill("Nobody");

  await page.getByLabel("Join code").fill("ZZZZZZ");
  await join.click();
  await expect(alert).toBeVisible();
  const refusal = (await alert.innerText()).trim();
  expect(refusal).toMatch(
    /doesn't match an open group|wrong codes in a minute/,
  );

  // A code that is not even the right shape is refused in exactly the same
  // words, so the form never reveals which part was wrong. Whether those words
  // mention the limit depends on how much of this machine's allowance the rest
  // of the file has spent, which is why this compares the two rather than
  // pinning either.
  await page.getByLabel("Join code").fill("Q");
  await join.click();
  await expect(alert).toHaveText(refusal);
});

test("rotating the code turns the old one off", async ({
  browser,
  request,
}) => {
  const address = `rotating-${Date.now()}@example.test`;
  const context = await browser.newContext();
  const leader = await context.newPage();

  await signInAsLeader(leader, request, address);
  await leader
    .getByLabel("What should the group call you?")
    .fill("Rotating Leader");
  await leader.getByRole("button", { name: "Save" }).click();
  await leader.getByLabel("Name this group").fill("Rotating group");
  await leader.getByRole("button", { name: "Create group" }).click();

  const before = (
    await leader.locator("p.font-mono").first().innerText()
  ).trim();
  await leader.getByRole("button", { name: "Rotate code" }).click();
  await expect(leader.locator("form").getByRole("status")).toContainText(
    "no longer works",
  );
  const after = (
    await leader.locator("p.font-mono").first().innerText()
  ).trim();
  expect(after).not.toBe(before);

  const participantContext = await browser.newContext();
  const participant = await participantContext.newPage();
  await participant.goto("/join");
  await participant.getByLabel("Join code").fill(before);
  await participant.getByLabel("Your name").fill("Too late");
  await participant.getByRole("button", { name: "Join" }).click();
  // Refused, and still on the form. Which refusal depends on how much of this
  // machine's join allowance the rest of the file has spent.
  await expect(participant.locator("form").getByRole("alert")).toContainText(
    /doesn't match an open group|wrong codes in a minute/,
  );
  await expect(participant).toHaveURL(/\/join$/);

  await context.close();
  await participantContext.close();
});

test("guessing is refused, and the room still gets in", async ({
  browser,
  request,
}) => {
  // The window's arithmetic is asserted in tests/rls/rate-limit.test.ts. What
  // that suite cannot reach is the form, so the allowance is spent here first
  // and the browser then makes two attempts against an address already over
  // it: a wrong code, and a right one.
  //
  // The failures are seeded for every address the server might see, because a
  // test cannot choose one — Next fills in `x-forwarded-for` from the socket on
  // a direct connection, which is the same reason a guesser cannot choose one
  // either. This test runs last in the file so the spent allowance does not
  // reach the tests above it.
  const address = `limited-${Date.now()}@example.test`;
  const leaderContext = await browser.newContext();
  const leader = await leaderContext.newPage();
  await signInAsLeader(leader, request, address);
  await leader
    .getByLabel("What should the group call you?")
    .fill("Limited Leader");
  await leader.getByRole("button", { name: "Save" }).click();
  await leader.getByLabel("Name this group").fill("Still open");
  await leader.getByRole("button", { name: "Create group" }).click();
  const code = (await leader.locator("p.font-mono").first().innerText()).trim();

  const admin = createClient(supabase.url, supabase.secretKey, {
    auth: { persistSession: false },
  });
  for (const ip of ["127.0.0.1", "::ffff:127.0.0.1", "::1"]) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { error } = await admin.rpc("record_failed_join", { p_ip: ip });
      expect(error).toBeNull();
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/join");
  await page.getByLabel("Your name").fill("Guesser");
  await page.getByLabel("Join code").fill("ZZZZZZ");
  await page.getByRole("button", { name: /^Join/ }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "wrong codes in a minute",
  );

  // Their name survived the failed attempt, which on a phone in a dim room is
  // the difference between one more try and giving up.
  await expect(page.getByLabel("Your name")).toHaveValue("Guesser");

  // And now the point of limiting failures rather than attempts: someone who
  // has the right code is not locked out because the room mistyped.
  await page.getByLabel("Join code").fill(code);
  await page.getByRole("button", { name: /^Join/ }).click();
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText("Still open")).toBeVisible();

  await context.close();
  await leaderContext.close();
});
