import { notFound } from "next/navigation";

import { findSession, type Session } from "@/content";

export interface SessionParams {
  params: Promise<{ number: string }>;
}

/** Resolves the `[number]` segment, or renders the not-found page. */
export async function sessionFromParams(
  params: SessionParams["params"],
): Promise<Session> {
  const { number } = await params;
  const session = findSession(Number(number));
  if (!session) notFound();
  return session;
}
