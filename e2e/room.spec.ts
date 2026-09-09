import { expect, test } from "@playwright/test";

import { session01Scenario as scenario } from "../content/scenarios/session-01";

import { pressUntil } from "./browser";
import { supabase } from "./leader";
import { startMeeting } from "./meeting";

/**
 * The live session, on two screens at once.
 *
 * The failure this suite exists to catch is the one that costs a meeting: the
 * projector and the phones disagreeing. So every assertion is made twice, once
 * on each screen, and the two are never allowed to be checked against a
 * fixture instead of against each other.
 *
 * Needs a local Supabase: `npx supabase start`.
 */
/** A leader's note as a reader would see it, if it ever reached a screen. */
function asRead(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

test("the projector and a phone run a whole scenario and agree at every beat", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `room-${Date.now()}@example.test`,
  );
  const { leader, code } = meeting;

  // --- a phone joins the group and finds the room without being told a URL --
  const phoneContext = await browser.newContext();
  const phone = await phoneContext.newPage();
  await phone.goto("/join");
  await phone.getByLabel("Join code").fill(code);
  await phone.getByLabel("Your name").fill("Ada");
  await phone.getByRole("button", { name: /^Join/ }).click();
  await expect(phone).toHaveURL(/\/me$/);
  await phone.getByRole("link", { name: /is running now/ }).click();
  await expect(phone).toHaveURL(/\/room\/[0-9a-f-]{36}$/);

  await expect(phone.getByText("Waiting for your leader")).toBeVisible();

  // Presence: both screens are on the channel, and the projector says so.
  await expect(leader.getByTestId("present-here")).toHaveText("2 here");

  for (const [index, beat] of scenario.beats.entries()) {
    const choice = beat.choices[0]!;
    const letter = choice.key.toUpperCase();

    // --- the leader opens, and the phone hears about it -------------------
    // Only the first beat is opened by hand: advancing out of a reveal opens
    // the next one, which is what a leader's thumb actually does.
    if (index === 0) {
      await leader.getByRole("button", { name: "Open the first vote" }).click();
    }

    // No reload anywhere: this is the realtime path, and it is the assertion.
    await expect(phone.getByText(beat.prompt)).toBeVisible();
    await expect(leader.getByText(beat.prompt)).toBeVisible();

    // --- the phone votes, and the projector counts it ----------------------
    await phone.getByRole("button", { name: choice.label }).click();
    await expect(phone.getByText(/^Locked in: /)).toBeVisible();
    // Broadcast from the database. Nothing on the phone reported this number.
    await expect(leader.getByTestId("present-voted")).toHaveText(
      "1 of 2 voted",
    );

    // --- the leader closes, and both screens show the same answer ----------
    await leader.getByRole("button", { name: "Close voting" }).click();
    await expect(leader.getByTestId("room-chose")).toContainText(
      `The room chose ${letter}`,
    );
    await expect(phone.getByTestId("room-chose")).toContainText(
      `The room chose ${letter}`,
    );

    // The consequence is projected and the leader's note never is. It is what
    // the leader should draw out of the room, and this screen faces the room.
    const projected = await leader.locator("body").innerText();
    expect(projected).not.toContain(asRead(choice.leaderNote));
    expect(await phone.locator("body").innerText()).not.toContain(
      asRead(choice.leaderNote),
    );

    await leader
      .getByRole("button", {
        name:
          index === scenario.beats.length - 1
            ? "Show where it ended"
            : "Next beat",
      })
      .click();
  }

  await expect(
    leader.getByRole("heading", { name: "Where it ended" }),
  ).toBeVisible();
  await expect(
    leader.getByText(scenario.closing.scriptureRefs[0]!),
  ).toBeVisible();
  await expect(phone.getByText("That is the case study.")).toBeVisible();
  await expect(
    phone.getByText(scenario.closing.scriptureRefs[0]!),
  ).toBeVisible();

  await phoneContext.close();
  await meeting.close();
});

test("a split room is handed to the leader rather than resolved quietly", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `tie-${Date.now()}@example.test`,
  );
  const { leader, code } = meeting;

  const phones = [];
  for (const name of ["Ada", "Bo"]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/join");
    await page.getByLabel("Join code").fill(code);
    await page.getByLabel("Your name").fill(name);
    await page.getByRole("button", { name: /^Join/ }).click();
    await page.getByRole("link", { name: /is running now/ }).click();
    await expect(page).toHaveURL(/\/room\/[0-9a-f-]{36}$/);
    phones.push({ context, page });
  }

  const beat = scenario.beats[0]!;
  const [first, second] = [beat.choices[0]!, beat.choices[1]!];

  await leader.getByRole("button", { name: "Open the first vote" }).click();
  await phones[0]!.page.getByRole("button", { name: first.label }).click();
  await phones[1]!.page.getByRole("button", { name: second.label }).click();
  await expect(leader.getByTestId("present-voted")).toHaveText("2 of 3 voted");

  // Space is what a clicker sends; the leader's hands are on the remote.
  await leader.keyboard.press(" ");

  await expect(
    leader.getByText("The room is split between A and B"),
  ).toBeVisible();
  for (const phone of phones) {
    await expect(phone.page.getByText("The room is split")).toBeVisible();
  }

  // Only the options that tied are offered: the split is the interesting part,
  // and a fifth answer would throw it away.
  await expect(
    leader.getByRole("button", { name: "Take this one" }),
  ).toHaveCount(2);

  await leader.keyboard.press("1");
  await expect(leader.getByTestId("room-chose")).toContainText(
    `The room chose ${first.key.toUpperCase()}`,
  );
  await expect(leader.getByTestId("room-chose")).toContainText("after a tie");
  for (const phone of phones) {
    await expect(phone.page.getByTestId("room-chose")).toContainText(
      `The room chose ${first.key.toUpperCase()}, after a tie`,
    );
  }

  for (const phone of phones) await phone.context.close();
  await meeting.close();
});

test("a phone whose realtime has died says so, and catches up when asked", async ({
  browser,
  request,
}) => {
  const meeting = await startMeeting(
    browser,
    request,
    `dropped-${Date.now()}@example.test`,
  );
  const { leader, code } = meeting;

  const phoneContext = await browser.newContext();
  // Every realtime socket is closed the moment it opens. Ordinary requests to
  // the application still work, which is the whole point: the state is in the
  // database, and the way back to it is a request rather than a reconnection.
  await phoneContext.routeWebSocket(
    (url) => url.pathname.includes("/realtime/"),
    (ws) => {
      ws.close();
    },
  );

  const phone = await phoneContext.newPage();
  await phone.goto("/join");
  await phone.getByLabel("Join code").fill(code);
  await phone.getByLabel("Your name").fill("Bo");
  await phone.getByRole("button", { name: /^Join/ }).click();
  await phone.getByRole("link", { name: /is running now/ }).click();
  await expect(phone).toHaveURL(/\/room\/[0-9a-f-]{36}$/);

  await expect(
    phone.getByRole("alert").filter({ hasText: "stopped updating" }),
  ).toBeVisible();

  const beat = scenario.beats[0]!;
  await leader.getByRole("button", { name: "Open the first vote" }).click();
  await expect(leader.getByText(beat.prompt)).toBeVisible();

  // Stale, and honest about it rather than pretending.
  await expect(phone.getByText("Waiting for your leader")).toBeVisible();
  await expect(phone.getByText(beat.prompt)).toBeHidden();

  await phone.getByRole("button", { name: "Catch up" }).click();
  await expect(phone.getByText(beat.prompt)).toBeVisible();

  // And it can still vote: the write never went over the socket either.
  const choice = beat.choices[1]!;
  await phone.getByRole("button", { name: choice.label }).click();
  await expect(phone.getByText(/^Locked in: /)).toBeVisible();
  await expect(leader.getByTestId("present-voted")).toHaveText("1 of 2 voted");

  await phoneContext.close();
  await meeting.close();
});

test("the show-of-hands deck runs with the backend unreachable", async ({
  browser,
}) => {
  const context = await browser.newContext();

  // Nothing may reach Supabase from this browser — no API call, no socket.
  const attempted: string[] = [];
  await context.route(`${supabase.url}/**`, (route) => {
    attempted.push(route.request().url());
    return route.abort();
  });
  await context.routeWebSocket(
    (url) => url.host === new URL(supabase.url).host,
    (ws) => {
      ws.close();
    },
  );

  const page = await context.newPage();
  await page.goto(`/deck/${scenario.id}`);

  await expect(
    page.getByRole("heading", { name: scenario.caseTitle }),
  ).toBeVisible();
  for (const member of scenario.cast) {
    await expect(page.getByText(member.name).first()).toBeVisible();
  }

  const first = scenario.beats[0]!;
  await expect(page.getByText("Show of hands")).toBeVisible();

  // Driven from a clicker throughout: premise, then the first beat.
  await pressUntil(page, "ArrowRight", page.getByText(first.prompt));
  for (const choice of first.choices) {
    await expect(page.getByText(choice.label)).toBeVisible();
  }

  // Nothing is counted and nothing is recorded: the leader looks at the room
  // and presses the number that won.
  await page.keyboard.press("1");
  await expect(
    page.getByText(`The room chose ${first.choices[0]!.key.toUpperCase()}`),
  ).toBeVisible();

  await page.keyboard.press("ArrowRight");
  const second = scenario.beats[1]!;
  await expect(page.getByText(second.prompt)).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(
    page.getByText(`The room chose ${first.choices[0]!.key.toUpperCase()}`),
  ).toBeVisible();

  // The claim this test is really making: none of that needed the network.
  expect(attempted).toEqual([]);

  await context.close();
});
