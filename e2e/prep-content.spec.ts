import { expect, test, type APIRequestContext } from "@playwright/test";

import {
  caseBank,
  glossary,
  handbook,
  resourceGroups,
  ruleOfPlay,
  sessions,
} from "../content";

/**
 * Phase 2's acceptance criterion: every session renders with content matching
 * the original file.
 *
 * Phase 1 already proved `content/` matches the HTML character for character,
 * so what is left to prove is that every field reaches the DOM — that no pane
 * quietly drops a teaching note or a leader's key. Each field is compared on
 * its letters and digits alone, which makes the check immune to markup,
 * whitespace, and typographic punctuation while still failing loudly if a field
 * is missing altogether.
 */
function squash(value: string): string {
  return (
    value
      .replace(/<[^>]*>/g, " ")
      // React escapes apostrophes and quotes as entities, so they have to go
      // before the alphanumeric filter or `&#x27;` survives as "x27".
      .replace(/&[#a-zA-Z0-9]+;/g, " ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
  );
}

/**
 * The rendered text of a page. Script and style blocks are removed first:
 * Next.js inlines the React payload into a <script>, and leaving it in would
 * make this test pass against markup that never renders.
 */
async function pageText(
  request: APIRequestContext,
  path: string,
): Promise<string> {
  const response = await request.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  const html = await response.text();
  return squash(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " "),
  );
}

function expectPresent(
  haystack: string,
  field: string,
  value: string,
  path: string,
): void {
  const needle = squash(value);
  expect(
    haystack.includes(needle),
    `${path} is missing ${field}: “${value.replace(/<[^>]*>/g, "").slice(0, 70)}…”`,
  ).toBe(true);
}

for (const session of sessions) {
  test(`session ${session.number} renders every field of the original`, async ({
    request,
  }) => {
    const base = `/sessions/${session.number}`;

    const plan = await pageText(request, base);
    expectPresent(plan, "the title", session.title, base);
    expectPresent(plan, "the subtitle", session.subtitle, base);
    expectPresent(plan, "the big idea", session.bigIdea, base);
    expectPresent(plan, "the icebreaker title", session.icebreaker.title, base);
    expectPresent(
      plan,
      "the icebreaker instructions",
      session.icebreaker.how,
      base,
    );
    expectPresent(
      plan,
      "the icebreaker rationale",
      session.icebreaker.why,
      base,
    );
    for (const [index, step] of session.plan.entries()) {
      expectPresent(plan, `plan step ${index} heading`, step.heading, base);
      expectPresent(plan, `plan step ${index} script`, step.script, base);
      for (const bullet of step.bullets) {
        expectPresent(plan, `a plan step ${index} bullet`, bullet, base);
      }
    }
    for (const note of session.teaching) {
      expectPresent(plan, "a teaching heading", note.heading, base);
      for (const point of note.points) {
        expectPresent(plan, "a teaching point", point, base);
      }
    }

    const scripture = await pageText(request, `${base}/scripture`);
    expectPresent(scripture, "the anchor reference", session.anchor.ref, base);
    expectPresent(scripture, "the anchor text", session.anchor.text, base);
    expectPresent(scripture, "the anchor gist", session.anchor.gist, base);
    for (const verse of session.support) {
      expectPresent(scripture, "a supporting reference", verse.ref, base);
      expectPresent(scripture, "a supporting gist", verse.gist, base);
    }

    const cases = await pageText(request, `${base}/cases`);
    for (const study of session.cases) {
      expectPresent(cases, "a case title", study.title, base);
      expectPresent(cases, "a case tagline", study.tagline, base);
      expectPresent(cases, "a case story", study.story, base);
      expectPresent(cases, "a case leader's key", study.leaderKey, base);
      for (const question of study.questions) {
        expectPresent(cases, "a case question", question, base);
      }
    }

    const discussion = await pageText(request, `${base}/discussion`);
    for (const question of session.discussion) {
      expectPresent(discussion, "a discussion question", question, base);
    }

    const takeHome = await pageText(request, `${base}/take-home`);
    expectPresent(takeHome, "the challenge", session.takeHome.challenge, base);
    expectPresent(takeHome, "the practice", session.takeHome.practice, base);
    expectPresent(takeHome, "the preparation", session.takeHome.prep, base);

    const slides = await pageText(request, `${base}/slides`);
    for (const [index, slide] of session.slides.entries()) {
      expectPresent(slides, `slide ${index} kicker`, slide.kicker, base);
      if (slide.heading)
        expectPresent(slides, `slide ${index} heading`, slide.heading, base);
      expectPresent(slides, `slide ${index} body`, slide.body, base);
      expectPresent(slides, `slide ${index} notes`, slide.notes, base);
    }
  });
}

test("the case bank renders every scenario", async ({ request }) => {
  const text = await pageText(request, "/cases");
  for (const study of caseBank) {
    expectPresent(text, "a case title", study.title, "/cases");
    expectPresent(text, "a case story", study.story, "/cases");
    for (const question of study.questions) {
      expectPresent(text, "a case question", question, "/cases");
    }
    if (study.care)
      expectPresent(text, "a pastoral-care note", study.care, "/cases");
  }
});

test("sources renders every group and item", async ({ request }) => {
  const text = await pageText(request, "/sources");
  for (const group of resourceGroups) {
    expectPresent(text, "a group name", group.group, "/sources");
    expectPresent(text, "a group note", group.note, "/sources");
    for (const item of group.items) {
      expectPresent(text, "a source title", item.title, "/sources");
      expectPresent(text, "a source location", item.where, "/sources");
      expectPresent(text, "a source lean label", item.leanLabel, "/sources");
      expectPresent(text, "a source description", item.description, "/sources");
    }
  }
});

test("the handbook renders every section", async ({ request }) => {
  const text = await pageText(request, "/handbook");
  for (const section of handbook) {
    expectPresent(text, "a section title", section.title, "/handbook");
    for (const entry of section.entries) {
      expectPresent(text, "an entry heading", entry.heading, "/handbook");
      expectPresent(text, "an entry body", entry.body, "/handbook");
    }
  }
  for (const session of sessions) {
    expectPresent(text, "a session anchor", session.anchor.ref, "/handbook");
  }
});

test("the worksheet renders every line and prompt", async ({ request }) => {
  const text = await pageText(request, "/rule-of-play");
  for (const line of ruleOfPlay.lines) {
    expectPresent(text, "a worksheet heading", line.heading, "/rule-of-play");
    expectPresent(text, "a worksheet hint", line.hint, "/rule-of-play");
  }
  expectPresent(
    text,
    "the closing line",
    ruleOfPlay.closingLine,
    "/rule-of-play",
  );
  for (const prompt of ruleOfPlay.dailyPrompts) {
    expectPresent(text, "a daily prompt", prompt, "/rule-of-play");
  }
});

test("the glossary renders on session 6, where the icebreaker uses it", async ({
  request,
}) => {
  const text = await pageText(request, "/sessions/6");
  for (const entry of glossary) {
    expectPresent(text, "a glossary term", entry.term, "/sessions/6");
    expectPresent(
      text,
      "a glossary definition",
      entry.definition,
      "/sessions/6",
    );
  }
});
