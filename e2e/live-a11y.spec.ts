import { expect, test } from "@playwright/test";

import { session01Scenario as scenario } from "../content/scenarios/session-01";

import { pressUntil, settled, violations } from "./browser";
import { joinRoom, startMeeting } from "./meeting";

/**
 * The two surfaces a meeting actually runs on, checked where they run.
 *
 * The prep pages and the show-of-hands deck go through axe on every pull
 * request because they render without a database. These do not, and they are
 * the ones with the read-at-distance case and the one-thumbed case in them —
 * so they get their own pass here, against a real session, in the states a
 * room sees rather than an empty one.
 */
test("the projector and the phone are clean at every state of a beat", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `a11y-${Date.now()}@example.test`,
    "Accessibility group",
  );
  const { leader, code } = meeting;
  const phone = await joinRoom(browser, code, "Ada");

  // --- before anything has started -----------------------------------------
  await settled(leader);
  expect(await violations(leader)).toEqual([]);
  await settled(phone.page);
  expect(await violations(phone.page)).toEqual([]);

  // --- with a vote open ----------------------------------------------------
  await leader.getByRole("button", { name: "Open the first vote" }).click();
  const beat = scenario.beats[0]!;
  await expect(leader.getByText(beat.prompt)).toBeVisible();
  await expect(phone.page.getByText(beat.prompt)).toBeVisible();

  await settled(leader);
  expect(await violations(leader)).toEqual([]);
  await settled(phone.page);
  expect(await violations(phone.page)).toEqual([]);

  // --- and at the reveal, which is where the colour is doing the work -------
  const choice = beat.choices[0]!;
  await phone.page.getByRole("button", { name: choice.label }).click();
  await leader.getByRole("button", { name: "Close voting" }).click();
  await expect(leader.getByTestId("room-chose")).toBeVisible();

  await settled(leader);
  expect(await violations(leader)).toEqual([]);
  await settled(phone.page);
  expect(await violations(phone.page)).toEqual([]);

  await phone.close();
  await meeting.close();
});

test("a phone can vote one-thumbed and be told what it did", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `thumb-${Date.now()}@example.test`,
    "Thumb group",
  );
  const { leader, code } = meeting;
  const phone = await joinRoom(browser, code, "Bo");

  await leader.getByRole("button", { name: "Open the first vote" }).click();
  const beat = scenario.beats[0]!;
  const choice = beat.choices[1]!;
  await expect(phone.page.getByText(beat.prompt)).toBeVisible();

  const button = phone.page.getByRole("button", { name: choice.label });
  // A choice is a toggle, and a screen reader should be able to say which one
  // is held — "Locked in" as a coloured border would be invisible to it.
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");

  // And the confirmation is announced rather than only shown.
  const status = phone.page.getByRole("status");
  await expect(status).toContainText("Locked in");
  await expect(status).toContainText(choice.label);

  await phone.close();
  await meeting.close();
});

test("the projector runs a whole beat from the keyboard alone", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `keys-${Date.now()}@example.test`,
    "Keyboard group",
  );
  const { leader, code } = meeting;
  const phone = await joinRoom(browser, code, "Cai");

  const first = scenario.beats[0]!;
  const second = scenario.beats[1]!;

  // Leaders use clickers, which send exactly these. Not one click below.
  await pressUntil(leader, "ArrowRight", leader.getByText(first.prompt));

  await phone.page
    .getByRole("button", { name: first.choices[0]!.label })
    .click();
  await expect(leader.getByTestId("present-voted")).toHaveText("1 of 2 voted");

  await leader.keyboard.press(" ");
  await expect(leader.getByTestId("room-chose")).toBeVisible();

  await leader.keyboard.press("Enter");
  await expect(leader.getByText(second.prompt)).toBeVisible();
  await expect(phone.page.getByText(second.prompt)).toBeVisible();

  // B blanks the screen mid-session, which is the other thing a clicker does.
  await leader.keyboard.press("b");
  await expect(
    leader.getByRole("button", { name: /Screen blanked/ }),
  ).toBeVisible();
  await leader.keyboard.press("Escape");
  await expect(leader.getByText(second.prompt)).toBeVisible();

  await phone.close();
  await meeting.close();
});
