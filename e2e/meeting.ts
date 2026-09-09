import {
  expect,
  type APIRequestContext,
  type Browser,
  type Page,
} from "@playwright/test";

import { signInAsLeader } from "./leader";

/**
 * A leader, a group, and a meeting on the projector.
 *
 * Shared because more than one suite needs a room to exist before it can test
 * anything about one, and because the path through it — magic link, display
 * name, group, join code, start — is the path a real leader takes, so a change
 * that breaks it should break every suite at once rather than one of them.
 */
export const RUN_URL = /\/present\/[0-9a-f-]{36}$/;

export interface Meeting {
  leader: Page;
  code: string;
  close: () => Promise<void>;
}

export async function startMeeting(
  browser: Browser,
  request: APIRequestContext,
  address: string,
  groupName = "Room group",
): Promise<Meeting> {
  const context = await browser.newContext();
  const leader = await context.newPage();

  await signInAsLeader(leader, request, address);
  await leader
    .getByLabel("What should the group call you?")
    .fill("Room Leader");
  await leader.getByRole("button", { name: "Save" }).click();
  await leader.getByLabel("Name this group").fill(groupName);
  await leader.getByRole("button", { name: "Create group" }).click();
  await expect(leader).toHaveURL(/\/groups\/[0-9a-f-]{36}$/);
  const code = (await leader.locator("p.font-mono").first().innerText()).trim();

  await leader.goto("/present");
  await leader.getByRole("button", { name: "Start" }).first().click();
  await expect(leader).toHaveURL(RUN_URL);

  return { leader, code, close: () => context.close() };
}

/** A phone in the room: joins with the code and opens the live session. */
export async function joinRoom(
  browser: Browser,
  code: string,
  name: string,
): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/join");
  await page.getByLabel("Join code").fill(code);
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("button", { name: /^Join/ }).click();
  await expect(page).toHaveURL(/\/me$/);
  await page.getByRole("link", { name: /is running now/ }).click();
  await expect(page).toHaveURL(/\/room\/[0-9a-f-]{36}$/);

  return { page, close: () => context.close() };
}
