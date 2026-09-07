import { describe, expect, it } from "vitest";

import {
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
