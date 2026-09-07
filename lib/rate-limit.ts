import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "./supabase/admin";

/**
 * Failed join attempts, ten per IP per minute.
 *
 * Only failures count. A whole group arrives from one church wifi address
 * inside a couple of minutes, and a limit on total attempts would lock out the
 * back half of the room; a limit on failures leaves legitimate joining
 * untouched while making it pointless to guess at 887 million combinations.
 */
export const FAILED_JOINS_PER_MINUTE = 10;

/**
 * The requester's address, as the proxy in front of us reports it.
 *
 * A client cannot be trusted to report its own address, which is exactly why
 * this is read here and passed to the database rather than accepted as a
 * parameter from the browser. Behind Vercel the platform sets
 * `x-forwarded-for`, and the first entry is the original client; on a direct
 * connection Next fills it in from the socket, so a browser cannot claim to be
 * somewhere else in either case.
 *
 * The limit is therefore only ever as trustworthy as the proxy in front of it.
 * If this is ever deployed behind something that forwards a client-supplied
 * header untouched, this function is where that has to be handled.
 */
export async function requesterIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headerList.get("x-real-ip") || "127.0.0.1";
}

export async function joinAttemptsExhausted(ip: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc(
    "failed_joins_last_minute",
    {
      p_ip: ip,
    },
  );
  // Fail open rather than closed: a rate limiter that has itself failed should
  // not be the reason a room cannot join. The attempt is still recorded.
  if (error) return false;
  return (data as number) >= FAILED_JOINS_PER_MINUTE;
}

export async function recordFailedJoin(ip: string): Promise<void> {
  await createAdminClient().rpc("record_failed_join", { p_ip: ip });
}
