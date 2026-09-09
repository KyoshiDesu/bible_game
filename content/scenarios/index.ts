import type { Scenario } from "../scenario-schema";

import { session01Scenario } from "./session-01";

/**
 * The playable scenarios. One so far — Session 1's, authored in phase 5 so the
 * room engine was built against real content rather than lorem ipsum. The other
 * nine are phase 7.
 */
export const scenarios: readonly Scenario[] = [session01Scenario];

export function findScenario(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}

export function scenariosForSession(sessionNumber: number): Scenario[] {
  return scenarios.filter(
    (scenario) => scenario.sessionNumber === sessionNumber,
  );
}
