import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { localSupabase } from "../tests/local-supabase";

/**
 * Signing in as a leader, for the suites that need one.
 *
 * The magic link is fetched out of the local mail server and followed, rather
 * than the session being forged: it is the only way a leader ever signs in, and
 * a test that skipped it would not be testing the thing that can break.
 */
const MAILPIT = "http://127.0.0.1:54324";
export const supabase = localSupabase();

interface MailpitSummary {
  messages: { ID: string; To: { Address: string }[] }[];
}

/** Waits for a message to the address and returns the link inside it. */
export async function magicLinkFor(
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

export async function signInAsLeader(
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
