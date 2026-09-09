import { describe, expect, it } from "vitest";

import { isScriptureReference } from "@/lib/scripture";
import {
  estimatePlaySeconds,
  scenariosForSession,
  PLAY_TIME_BUDGET,
  scenarioSchema,
  scenarios,
  caseBank,
  caseBankEntrySchema,
  glossary,
  glossaryEntrySchema,
  handbook,
  handbookSectionSchema,
  resourceGroups,
  resourceGroupSchema,
  ruleOfPlay,
  ruleOfPlaySchema,
  sessions,
  sessionSchema,
  units,
  findSession,
} from "@/content";
import { deckIndex, sessionIndex } from "@/content/session-index";

/**
 * The counts below are the ones the extraction produced from
 * press-start-curriculum.html. They are asserted rather than derived so that
 * losing a session, a case, or a resource group is a test failure rather than a
 * quietly shorter page. Changing content is allowed; changing it by accident is
 * what this guards against.
 */
const EXPECTED = {
  sessions: 10,
  caseBank: 12,
  resourceGroups: 4,
  resources: 30,
  glossary: 11,
  handbookSections: 4,
  ruleOfPlayLines: 6,
  dailyPrompts: 14,
  units: 4,
  /** Per session, held by every one of the ten. */
  perSession: {
    cases: 2,
    teaching: 3,
    planSteps: 6,
    discussion: 5,
    slides: 8,
    minutes: 40,
  },
} as const;

describe("counts", () => {
  it("has every session, case, and resource group from the original", () => {
    expect(sessions).toHaveLength(EXPECTED.sessions);
    expect(caseBank).toHaveLength(EXPECTED.caseBank);
    expect(resourceGroups).toHaveLength(EXPECTED.resourceGroups);
    expect(
      resourceGroups.reduce((total, group) => total + group.items.length, 0),
    ).toBe(EXPECTED.resources);
    expect(glossary).toHaveLength(EXPECTED.glossary);
    expect(handbook).toHaveLength(EXPECTED.handbookSections);
    expect(ruleOfPlay.lines).toHaveLength(EXPECTED.ruleOfPlayLines);
    expect(ruleOfPlay.dailyPrompts).toHaveLength(EXPECTED.dailyPrompts);
    expect(units).toHaveLength(EXPECTED.units);
  });

  it("numbers the sessions one to ten, in order", () => {
    expect(sessions.map((session) => session.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });
});

describe("schema", () => {
  it.each(sessions.map((session) => [session.number, session] as const))(
    "session %i validates",
    (_number, session) => {
      expect(sessionSchema.safeParse(session)).toMatchObject({ success: true });
    },
  );

  it("the case bank validates", () => {
    for (const entry of caseBank) {
      expect(caseBankEntrySchema.safeParse(entry)).toMatchObject({
        success: true,
      });
    }
  });

  it("resources, glossary, handbook, and the worksheet validate", () => {
    for (const group of resourceGroups) {
      expect(resourceGroupSchema.safeParse(group)).toMatchObject({
        success: true,
      });
    }
    for (const entry of glossary) {
      expect(glossaryEntrySchema.safeParse(entry)).toMatchObject({
        success: true,
      });
    }
    for (const section of handbook) {
      expect(handbookSectionSchema.safeParse(section)).toMatchObject({
        success: true,
      });
    }
    expect(ruleOfPlaySchema.safeParse(ruleOfPlay)).toMatchObject({
      success: true,
    });
  });
});

/*
 * The client's copy of the session list.
 *
 * `content/session-index.ts` exists so that the navigation rail and the
 * breadcrumb — both client components — do not pull the whole curriculum into
 * every prep page's JavaScript. It is a literal, so this is what stops it
 * drifting from the thing it is a summary of.
 */
describe("the session index the client is given", () => {
  it("says exactly what the curriculum says", () => {
    expect(sessionIndex).toEqual(
      sessions.map((session) => ({
        number: session.number,
        title: session.title,
      })),
    );
  });

  it("lists exactly the decks that exist", () => {
    expect(deckIndex).toEqual(
      scenarios.map((scenario) => ({
        id: scenario.id,
        caseTitle: scenario.caseTitle,
      })),
    );
  });
});

describe("schema guards", () => {
  const session = sessions[0];

  it("has a session to guard", () => {
    expect(session).toBeDefined();
  });

  it("rejects markup outside the trusted-html allowlist", () => {
    const tampered = {
      ...session,
      bigIdea: "<img src=x onerror=alert(1)>",
    };
    const result = sessionSchema.safeParse(tampered);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("disallowed tag <img>");
  });

  it("rejects markup in a field nothing renders as HTML", () => {
    const result = sessionSchema.safeParse({
      ...session,
      title: "<b>Press Start</b>",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("plain-text");
  });

  it("rejects a field the extraction did not know about", () => {
    const result = sessionSchema.safeParse({
      ...session,
      homework: "unmapped",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field rather than rendering a blank pane", () => {
    const { teaching: _teaching, ...withoutTeaching } = { ...session };
    expect(sessionSchema.safeParse(withoutTeaching).success).toBe(false);
  });
});

describe("session structure", () => {
  it.each(sessions.map((session) => [session.number, session] as const))(
    "session %i has all six panes populated",
    (_number, session) => {
      expect(session.cases).toHaveLength(EXPECTED.perSession.cases);
      expect(session.teaching).toHaveLength(EXPECTED.perSession.teaching);
      expect(session.plan).toHaveLength(EXPECTED.perSession.planSteps);
      expect(session.discussion).toHaveLength(EXPECTED.perSession.discussion);
      expect(session.slides).toHaveLength(EXPECTED.perSession.slides);
      expect(session.support.length).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(sessions.map((session) => [session.number, session] as const))(
    "session %i runs to forty minutes with a consistent clock",
    (_number, session) => {
      let elapsed = 0;
      for (const step of session.plan) {
        const [hours, minutes] = step.clock.split(":").map(Number);
        expect(hours).toBe(0);
        expect(minutes).toBe(elapsed);
        elapsed += step.minutes;
      }
      expect(elapsed).toBe(EXPECTED.perSession.minutes);
    },
  );

  it("names one of the four units on every session", () => {
    for (const session of sessions) {
      expect(units.some((unit) => session.unit.endsWith(unit))).toBe(true);
    }
  });

  it("finds a session by number and nothing outside the range", () => {
    expect(findSession(1)?.title).toBe("Press Start");
    expect(findSession(10)?.number).toBe(10);
    expect(findSession(11)).toBeUndefined();
  });
});

describe("case bank", () => {
  it("points every entry at a session that exists", () => {
    for (const entry of caseBank) {
      expect(findSession(entry.primarySession)).toBeDefined();
    }
  });

  it("keeps the pastoral-care note on the cases that carry one", () => {
    expect(caseBank.filter((entry) => entry.care !== undefined)).toHaveLength(
      2,
    );
  });
});

describe("scripture references", () => {
  it("parses every anchor and supporting reference in the curriculum", () => {
    for (const session of sessions) {
      expect(
        isScriptureReference(session.anchor.ref),
        `session ${session.number} anchor: ${session.anchor.ref}`,
      ).toBe(true);
      for (const verse of session.support) {
        expect(
          isScriptureReference(verse.ref),
          `session ${session.number} support: ${verse.ref}`,
        ).toBe(true);
      }
    }
  });
});

describe("scenarios", () => {
  it("covers the whole curriculum, in its own order", () => {
    expect(scenarios).toHaveLength(sessions.length);
    expect(scenarios.map((scenario) => scenario.sessionNumber)).toEqual(
      sessions.map((session) => session.number),
    );
    for (const session of sessions) {
      expect(scenariosForSession(session.number)).toHaveLength(1);
    }
  });

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s takes its scripture from its own session's texts",
    (_id, scenario) => {
      // The scenarios are derived from their session's primary case rather
      // than invented alongside it, and this is the machine-checkable half of
      // that claim: a scenario that cites a passage its session never opens
      // has drifted away from the meeting it is supposed to be part of.
      const session = findSession(scenario.sessionNumber);
      const texts = new Set([
        session?.anchor.ref,
        ...(session?.support ?? []).map((support) => support.ref),
      ]);
      for (const reference of scenario.closing.scriptureRefs) {
        expect(texts.has(reference), reference).toBe(true);
      }
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s validates",
    (_id, scenario) => {
      expect(scenarioSchema.safeParse(scenario)).toMatchObject({
        success: true,
      });
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s belongs to a session that exists",
    (_id, scenario) => {
      expect(findSession(scenario.sessionNumber)).toBeDefined();
      expect(scenario.id.startsWith(`s${scenario.sessionNumber}-`)).toBe(true);
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s fits inside the twelve minutes the plan gives a case study",
    (_id, scenario) => {
      const seconds = estimatePlaySeconds(scenario);
      expect(seconds).toBeLessThanOrEqual(PLAY_TIME_BUDGET);
      // Also a floor: a scenario that estimates at two minutes has not been
      // written, it has been sketched.
      expect(seconds).toBeGreaterThan(3 * 60);
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s numbers its beats from zero, without gaps",
    (_id, scenario) => {
      expect(scenario.beats.map((beat) => beat.index)).toEqual(
        scenario.beats.map((_beat, position) => position),
      );
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s gives every beat three or four distinct choices, keyed in order",
    (_id, scenario) => {
      for (const beat of scenario.beats) {
        const keys = beat.choices.map((choice) => choice.key);
        expect(keys).toEqual(["a", "b", "c", "d"].slice(0, keys.length));
        expect(new Set(beat.choices.map((choice) => choice.label)).size).toBe(
          keys.length,
        );
      }
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s cites scripture that parses",
    (_id, scenario) => {
      for (const reference of scenario.closing.scriptureRefs) {
        expect(isScriptureReference(reference), reference).toBe(true);
      }
    },
  );

  it.each(scenarios.map((scenario) => [scenario.id, scenario] as const))(
    "%s gives the leader something to draw out at every choice",
    (_id, scenario) => {
      // The rule a machine cannot check is that two choices per beat are
      // genuinely defensible. What it can check is that the author wrote a
      // leader's note for every one of them, which is where that argument lives.
      for (const beat of scenario.beats) {
        for (const choice of beat.choices) {
          expect(
            choice.leaderNote.length,
            `${beat.index}${choice.key}`,
          ).toBeGreaterThan(80);
        }
      }
    },
  );
});

/*
 * The scenario schema, shown not to be vacuous.
 *
 * Ten scenarios pass it, which is only reassuring if it is capable of failing.
 * Each guard below is a mistake that would otherwise reach a room: a beat with
 * nothing to choose between, a scenario that outlasts the twelve minutes the
 * plan gives it, or markup in a label that is rendered as text on a phone.
 */
describe("scenario guards", () => {
  const scenario = scenarios[0];

  it("has a scenario to guard", () => {
    expect(scenario).toBeDefined();
  });

  it("rejects a beat with fewer than three choices", () => {
    const thin = {
      ...scenario,
      beats: scenario!.beats.map((beat) => ({
        ...beat,
        choices: beat.choices.slice(0, 2),
      })),
    };
    expect(scenarioSchema.safeParse(thin).success).toBe(false);
  });

  it("rejects a beat with more than four", () => {
    const first = scenario!.beats[0]!;
    const crowded = {
      ...scenario,
      beats: [
        {
          ...first,
          choices: [...first.choices, { ...first.choices[0]!, key: "e" }],
        },
        ...scenario!.beats.slice(1),
      ],
    };
    expect(scenarioSchema.safeParse(crowded).success).toBe(false);
  });

  it("rejects a choice key that is not a single letter", () => {
    const first = scenario!.beats[0]!;
    const result = scenarioSchema.safeParse({
      ...scenario,
      beats: [
        {
          ...first,
          choices: first.choices.map((choice, position) =>
            position === 0 ? { ...choice, key: "aa" } : choice,
          ),
        },
        ...scenario!.beats.slice(1),
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects markup in a label, which is rendered as text on a phone", () => {
    const first = scenario!.beats[0]!;
    const result = scenarioSchema.safeParse({
      ...scenario,
      beats: [
        {
          ...first,
          choices: first.choices.map((choice, position) =>
            position === 0 ? { ...choice, label: "<b>delete it</b>" } : choice,
          ),
        },
        ...scenario!.beats.slice(1),
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("plain-text");
  });

  it("rejects markup outside the allowlist in a consequence", () => {
    const first = scenario!.beats[0]!;
    const result = scenarioSchema.safeParse({
      ...scenario,
      beats: [
        {
          ...first,
          choices: first.choices.map((choice, position) =>
            position === 0
              ? { ...choice, consequence: "<script>alert(1)</script>" }
              : choice,
          ),
        },
        ...scenario!.beats.slice(1),
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(
      "disallowed tag <script>",
    );
  });

  it("catches a scenario that has outgrown its twelve minutes", () => {
    const padded = {
      ...scenario!,
      premise: `${scenario!.premise} ${"word ".repeat(2000)}`,
    };
    expect(estimatePlaySeconds(padded)).toBeGreaterThan(PLAY_TIME_BUDGET);
  });
});
