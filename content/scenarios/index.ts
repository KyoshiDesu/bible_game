import type { Scenario } from "../scenario-schema";

import { session01Scenario } from "./session-01";
import { session02Scenario } from "./session-02";
import { session03Scenario } from "./session-03";
import { session04Scenario } from "./session-04";
import { session05Scenario } from "./session-05";
import { session06Scenario } from "./session-06";
import { session07Scenario } from "./session-07";
import { session08Scenario } from "./session-08";
import { session09Scenario } from "./session-09";
import { session10Scenario } from "./session-10";

/**
 * The playable scenarios, in the curriculum's own order.
 *
 * Each is derived from its session's primary case study and leader's key, so
 * that the discussion questions and the theology still land after a room has
 * played it. Order matters more than it looks: written in sequence, each one
 * inherits its session's particular question rather than the previous
 * scenario's rhythm.
 */
export const scenarios: readonly Scenario[] = [
  session01Scenario,
  session02Scenario,
  session03Scenario,
  session04Scenario,
  session05Scenario,
  session06Scenario,
  session07Scenario,
  session08Scenario,
  session09Scenario,
  session10Scenario,
];

export function findScenario(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

export function scenariosForSession(sessionNumber: number): Scenario[] {
  return scenarios.filter(
    (scenario) => scenario.sessionNumber === sessionNumber,
  );
}
