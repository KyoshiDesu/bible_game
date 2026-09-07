import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

import { createClient } from "@supabase/supabase-js";

import { localSupabase } from "../tests/local-supabase";

/**
 * Phase 3's acceptance criterion: a group created in one browser, joined from
 * another with nothing but a code and a name.
 *
 * Both halves are real. The leader's magic link is fetched out of the local
 * mail server and followed, rather than the session being forged, because the
 * link is the only way a leader ever signs in and a test that skipped it would
 * not be testing the thing that can break.
 *
 * Needs a local Supabase: `npx supabase start`.
 */
const MAILPIT = "http://127.0.0.1:54324";
const supabase = localSupabase();

// The last test in this file spends the join allowance for this machine's
// address, so the file runs in order rather than in parallel.
test.describe.configure({ mode: "serial" });

interface MailpitSummary {
  messages: { ID: string; To: { Address: string }[] }[];
}

/** Waits for a message to the address and returns the link inside it. */
async function magicLinkFor(
  request: APIRequestContext,
  address: string,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const listing = await request.get(`${MAILPIT}/api/v1/messages?limit=100`);
    if (listing.ok()) {
      const { messages } = (await listing.json()) as MailpitSummary;
      const message = messages.find((candidate) =>
        candidate.To.some((recipient) => recipient.Address === address),
      );
      if (message) {
        const body = await request.get(
          `${MAILPIT}/api/v1/message/${message.ID}`,
        );
        const { HTML, Text } = (await body.json()) as {
          HTML: string;
          Text: string;
        };
        const found = /https?:\/\/[^"'\s<>]*\/auth\/confirm[^"'\s<>]*/.exec(
          `${HTML}\n${Text}`,
        );
        if (found) return found[0].replaceAll("&amp;", "&");
        throw new Error(`No confirm link in the message to ${address}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No message arrived for ${address}`);
}

async function signInAsLeader(
  page: Page,
  request: APIRequestContext,
  address: string,
) {
  await page.goto("/sign-in");
  await page.getByLabel("Your email").fill(address);
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.locator("form").getByRole("status")).toContainText(
    "Check your email",
  );

  await page.goto(await magicLinkFor(request, address));
  await expect(page).toHaveURL(/\/groups$/);
}

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
  await page.getByLabel("Join code").fill("ZZZZZZ");
  await page.getByLabel("Your name").fill("Nobody");
  await page.getByRole("button", { name: "Join" }).click();

  // Scoped to the form: Next renders its own live region with role="alert".
  const alert = page.locator("form").getByRole("alert");
  await expect(alert).toContainText("doesn't match an open group");

  // A code that is not even the right shape says exactly the same thing, so the
  // form never reveals which part was wrong.
  await page.getByLabel("Join code").fill("Q");
  await page.getByRole("button", { name: "Join" }).click();
  await expect(alert).toContainText("doesn't match an open group");
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
  await expect(participant.locator("form").getByRole("alert")).toContainText(
    "doesn't match an open group",
  );

  await context.close();
  await participantContext.close();
});

test("the join form refuses to keep answering a guesser", async ({ page }) => {
  // The window's arithmetic is asserted in tests/rls/rate-limit.test.ts. What
  // that suite cannot reach is the form, so the allowance is spent here first
  // and the browser then makes one attempt against an address already over it.
  //
  // The failures are seeded for every address the server might see, because a
  // test cannot choose one: Next fills in `x-forwarded-for` from the socket on
  // a direct connection, which is the same reason a guesser cannot choose one
  // either. This test runs last in the file so the spent allowance does not
  // reach the tests above it.
  const admin = createClient(supabase.url, supabase.secretKey, {
    auth: { persistSession: false },
  });
  for (const ip of ["127.0.0.1", "::ffff:127.0.0.1", "::1"]) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const { error } = await admin.rpc("record_failed_join", { p_ip: ip });
      expect(error).toBeNull();
    }
  }

  await page.goto("/join");
  await page.getByLabel("Join code").fill("ZZZZZZ");
  await page.getByLabel("Your name").fill("Guesser");
  await page.getByRole("button", { name: /^Join/ }).click();

  await expect(page.locator("form").getByRole("alert")).toContainText(
    "wrong codes in a minute",
  );
});
