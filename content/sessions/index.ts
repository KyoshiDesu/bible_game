// Generated from press-start-curriculum.html by scripts/extract-content.ts.
// Edit this file directly — the extraction script was a one-time migration.

import type { Session } from "../schema";
import { session01 } from "./session-01";
import { session02 } from "./session-02";
import { session03 } from "./session-03";
import { session04 } from "./session-04";
import { session05 } from "./session-05";
import { session06 } from "./session-06";
import { session07 } from "./session-07";
import { session08 } from "./session-08";
import { session09 } from "./session-09";
import { session10 } from "./session-10";

export const sessions: readonly Session[] = [
  session01,
  session02,
  session03,
  session04,
  session05,
  session06,
  session07,
  session08,
  session09,
  session10,
];

export function findSession(number: number): Session | undefined {
  return sessions.find((session) => session.number === number);
}
