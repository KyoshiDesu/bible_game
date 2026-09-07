import { describe, expect, it } from "vitest";

import { browserClient, serviceClient } from "./harness";

/**
 * Ten failed join attempts per IP per minute.
 *
 * Only failures are counted. A whole group arrives from one church wifi address
 * inside a couple of minutes, so a limit on total attempts would lock out the
 * back half of the room; a limit on failures leaves legitimate joining
 * untouched while making it pointless to guess at 887 million combinations.
 */
const LIMIT = 10;

let octet = 0;

/** A fresh address per test, so one test's guesses never count against another. */
function freshIp(): string {
  octet += 1;
  return `198.51.100.${octet}`;
}

async function count(ip: string): Promise<number> {
  const { data, error } = await serviceClient().rpc(
    "failed_joins_last_minute",
    {
      p_ip: ip,
    },
  );
  expect(error).toBeNull();
  return data as number;
}

async function record(ip: string): Promise<void> {
  const { error } = await serviceClient().rpc("record_failed_join", {
    p_ip: ip,
  });
  expect(error).toBeNull();
}

describe("counting failed joins", () => {
  it("starts at nothing", async () => {
    expect(await count(freshIp())).toBe(0);
  });

  it("allows nine and stops the tenth", async () => {
    const ip = freshIp();
    for (let attempt = 0; attempt < LIMIT - 1; attempt++) await record(ip);
    expect(await count(ip)).toBeLessThan(LIMIT);

    await record(ip);
    expect(await count(ip)).toBeGreaterThanOrEqual(LIMIT);
  });

  it("counts each address separately, so one guesser does not close the door on a room", async () => {
    const guesser = freshIp();
    const room = freshIp();
    for (let attempt = 0; attempt < LIMIT + 5; attempt++) await record(guesser);

    expect(await count(guesser)).toBeGreaterThanOrEqual(LIMIT);
    expect(await count(room)).toBe(0);
  });

  it("is refused to a browser, which is the only reason it means anything", async () => {
    const browser = browserClient();
    const anonymous = await browser.auth.signInAnonymously();
    expect(anonymous.error).toBeNull();

    const ip = freshIp();
    expect(
      (await browser.rpc("record_failed_join", { p_ip: ip })).error,
    ).not.toBeNull();
    expect(
      (await browser.rpc("failed_joins_last_minute", { p_ip: ip })).error,
    ).not.toBeNull();
  });
});
