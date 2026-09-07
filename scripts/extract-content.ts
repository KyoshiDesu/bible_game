/**
 * One-time migration: lift the curriculum data out of `press-start-curriculum.html`
 * and emit typed modules under `content/`.
 *
 * This is not a build step. Per the implementation plan it is deleted once its
 * output is committed; the HTML stays in the repo, so the extraction is
 * reproducible from git history if it is ever needed again.
 *
 *   node --experimental-strip-types scripts/extract-content.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";

const SOURCE = "press-start-curriculum.html";
const html = readFileSync(SOURCE, "utf8");
const lines = html.split("\n");

/* ---------------------------------------------------------------- slicing */

function lineIndex(predicate: (line: string) => boolean, what: string): number {
  const i = lines.findIndex(predicate);
  if (i === -1) throw new Error(`Could not locate ${what} in ${SOURCE}`);
  return i;
}

// The data block runs from `const BG = ...` to the line before the helpers banner.
const dataStart = lineIndex(
  (l) => l.startsWith("const BG = "),
  "the BG helper",
);
const dataEnd = lineIndex(
  (l) => l.includes("============ helpers ============"),
  "the helpers banner",
);
const dataBlock = lines.slice(dataStart, dataEnd).join("\n");

// UNITS sits below the helpers, on its own line.
const unitsLine =
  lines[lineIndex((l) => l.startsWith("const UNITS = "), "the UNITS array")];

// The rule-of-play worksheet lives inside a template literal in the markup, as
// two self-contained array literals. Slice each by its opening bracket.
function arrayLiteralAfter(
  marker: string,
  openMarker: string,
  what: string,
): string {
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`Could not locate ${what} in ${SOURCE}`);
  const open = html.lastIndexOf(openMarker, start);
  if (open === -1)
    throw new Error(`Could not locate the opening bracket of ${what}`);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") {
      depth--;
      if (depth === 0) return html.slice(open, i + 1);
    }
  }
  throw new Error(`Unbalanced brackets while reading ${what}`);
}

const worksheetLiteral = arrayLiteralAfter(
  `["What I play"`,
  "[[",
  "the worksheet headings",
);
const promptsLiteral = arrayLiteralAfter(
  `"What did I play today, and did I choose the start?"`,
  "[",
  "the daily prompts",
);

/* -------------------------------------------------------------- evaluating */

interface RawBag {
  SESSIONS: RawSession[];
  RESOURCES: RawResourceGroup[];
  EXTRA_CASES: RawCase[];
  GLOSSARY: { t: string; d: string }[];
  HANDBOOK: Record<string, { h: string; p: string }[]>;
  UNITS: string[];
  WORKSHEET: [string, string][];
  PROMPTS: string[];
}

interface RawCase {
  title: string;
  tagline: string;
  story: string;
  questions: string[];
  leaderKey?: string;
  care?: string;
  s?: number;
}
interface RawSession {
  n: number;
  unit: string;
  title: string;
  subtitle: string;
  bigIdea: string;
  icebreaker: { title: string; how: string; why: string };
  anchor: { ref: string; text: string; gist: string };
  support: { ref: string; gist: string }[];
  teaching: { h: string; body: string[] }[];
  plan: {
    clock: string;
    mins: number;
    h: string;
    script: string;
    bullets: string[];
  }[];
  cases: RawCase[];
  discussion: string[];
  takehome: { challenge: string; practice: string; prep: string };
  slides: { kicker: string; h: string; body: string; notes: string }[];
}
interface RawResourceGroup {
  group: string;
  note: string;
  items: { t: string; w: string; lean: string; leanLabel: string; d: string }[];
}

const sandbox: Record<string, unknown> = {};
const context = createContext(sandbox);
runInContext(
  [
    dataBlock,
    unitsLine,
    `const WORKSHEET = ${worksheetLiteral};`,
    `const PROMPTS = ${promptsLiteral};`,
    "({ SESSIONS, RESOURCES, EXTRA_CASES, GLOSSARY, HANDBOOK, UNITS, WORKSHEET, PROMPTS })",
  ].join("\n"),
  context,
  { filename: SOURCE },
);
const raw = runInContext(
  "({ SESSIONS, RESOURCES, EXTRA_CASES, GLOSSARY, HANDBOOK, UNITS, WORKSHEET, PROMPTS })",
  context,
) as RawBag;

/* ------------------------------------------------------------- key guards */

// The mapping below renames terse authoring keys to readable ones. A key present
// in the source but absent from the expected set would otherwise be dropped in
// silence, so every object is checked before it is transformed.
function expectKeys(
  obj: object,
  allowed: readonly string[],
  path: string,
): void {
  const unexpected = Object.keys(obj).filter((k) => !allowed.includes(k));
  if (unexpected.length > 0) {
    throw new Error(
      `${path}: unexpected key(s) ${unexpected.join(", ")} — extend the mapping`,
    );
  }
}

/* ---------------------------------------------------------------- mapping */

function mapCase(c: RawCase, path: string) {
  expectKeys(
    c,
    ["title", "tagline", "story", "questions", "leaderKey", "care", "s"],
    path,
  );
  return {
    title: c.title,
    tagline: c.tagline,
    story: c.story,
    questions: c.questions,
    ...(c.leaderKey === undefined ? {} : { leaderKey: c.leaderKey }),
    ...(c.care === undefined ? {} : { care: c.care }),
  };
}

function mapSession(s: RawSession) {
  const path = `session ${s.n}`;
  expectKeys(
    s,
    [
      "n",
      "unit",
      "title",
      "subtitle",
      "bigIdea",
      "icebreaker",
      "anchor",
      "support",
      "teaching",
      "plan",
      "cases",
      "discussion",
      "takehome",
      "slides",
    ],
    path,
  );
  expectKeys(s.icebreaker, ["title", "how", "why"], `${path} icebreaker`);
  expectKeys(s.anchor, ["ref", "text", "gist"], `${path} anchor`);
  s.support.forEach((x, i) =>
    expectKeys(x, ["ref", "gist"], `${path} support[${i}]`),
  );
  s.teaching.forEach((x, i) =>
    expectKeys(x, ["h", "body"], `${path} teaching[${i}]`),
  );
  s.plan.forEach((x, i) =>
    expectKeys(
      x,
      ["clock", "mins", "h", "script", "bullets"],
      `${path} plan[${i}]`,
    ),
  );
  expectKeys(s.takehome, ["challenge", "practice", "prep"], `${path} takehome`);
  s.slides.forEach((x, i) =>
    expectKeys(x, ["kicker", "h", "body", "notes"], `${path} slides[${i}]`),
  );

  return {
    number: s.n,
    unit: s.unit,
    title: s.title,
    subtitle: s.subtitle,
    bigIdea: s.bigIdea,
    icebreaker: s.icebreaker,
    anchor: s.anchor,
    support: s.support,
    teaching: s.teaching.map((t) => ({ heading: t.h, points: t.body })),
    plan: s.plan.map((p) => ({
      clock: p.clock,
      minutes: p.mins,
      heading: p.h,
      script: p.script,
      bullets: p.bullets,
    })),
    cases: s.cases.map((c, i) => mapCase(c, `${path} cases[${i}]`)),
    discussion: s.discussion,
    takeHome: s.takehome,
    slides: s.slides.map((sl) => ({
      kicker: sl.kicker,
      heading: sl.h,
      body: sl.body,
      notes: sl.notes,
    })),
  };
}

const LEAN: Record<string, string> = {
  n: "reference",
  c: "christian",
  s: "secular",
};

function mapResourceGroup(g: RawResourceGroup) {
  expectKeys(g, ["group", "note", "items"], `resource group ${g.group}`);
  return {
    group: g.group,
    note: g.note,
    items: g.items.map((i) => {
      expectKeys(i, ["t", "w", "lean", "leanLabel", "d"], `resource ${i.t}`);
      const lean = LEAN[i.lean];
      if (lean === undefined)
        throw new Error(`resource ${i.t}: unknown lean code "${i.lean}"`);
      return {
        title: i.t,
        where: i.w,
        lean,
        leanLabel: i.leanLabel,
        description: i.d,
      };
    }),
  };
}

function mapBankCase(c: RawCase, i: number) {
  const mapped = mapCase(c, `case bank[${i}]`);
  if (c.s === undefined)
    throw new Error(`case bank[${i}]: missing session affinity`);
  return { ...mapped, primarySession: c.s };
}

/* --------------------------------------------------------------- emitting */

const BANNER = `// Generated from press-start-curriculum.html by scripts/extract-content.ts.\n// Edit this file directly — the extraction script was a one-time migration.\n`;

function literal(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function emit(file: string, body: string): void {
  writeFileSync(file, `${BANNER}\n${body}`);
  console.log(`  wrote ${file}`);
}

const sessions = raw.SESSIONS.map(mapSession);
if (sessions.length === 0) throw new Error("no sessions extracted");

for (const session of sessions) {
  const pad = String(session.number).padStart(2, "0");
  emit(
    `content/sessions/session-${pad}.ts`,
    `import type { Session } from "../schema";\n\nexport const session${pad} = ${literal(session)} satisfies Session;\n`,
  );
}

const pads = sessions.map((s) => String(s.number).padStart(2, "0"));
emit(
  "content/sessions/index.ts",
  [
    `import type { Session } from "../schema";`,
    ...pads.map((p) => `import { session${p} } from "./session-${p}";`),
    ``,
    `export const sessions: readonly Session[] = [${pads.map((p) => `session${p}`).join(", ")}];`,
    ``,
    `export function findSession(number: number): Session | undefined {`,
    `  return sessions.find((session) => session.number === number);`,
    `}`,
    ``,
  ].join("\n"),
);

emit(
  "content/resources.ts",
  `import type { ResourceGroup } from "./schema";\n\nexport const resourceGroups = ${literal(raw.RESOURCES.map(mapResourceGroup))} satisfies ResourceGroup[];\n`,
);

emit(
  "content/case-bank.ts",
  `import type { CaseBankEntry } from "./schema";\n\nexport const caseBank = ${literal(raw.EXTRA_CASES.map(mapBankCase))} satisfies CaseBankEntry[];\n`,
);

emit(
  "content/glossary.ts",
  `import type { GlossaryEntry } from "./schema";\n\nexport const glossary = ${literal(
    raw.GLOSSARY.map((g) => {
      expectKeys(g, ["t", "d"], `glossary ${g.t}`);
      return { term: g.t, definition: g.d };
    }),
  )} satisfies GlossaryEntry[];\n`,
);

const HANDBOOK_SECTIONS: [keyof typeof raw.HANDBOOK, string][] = [
  ["shape", "The shape of the series"],
  ["running", "Running a session"],
  ["care", "Pastoral care"],
  ["sourcing", "Sources and honesty"],
];
expectKeys(
  raw.HANDBOOK,
  HANDBOOK_SECTIONS.map(([k]) => k as string),
  "handbook",
);
emit(
  "content/handbook.ts",
  `import type { HandbookSection } from "./schema";\n\nexport const handbook = ${literal(
    HANDBOOK_SECTIONS.map(([key, title]) => {
      const entries = raw.HANDBOOK[key];
      if (!entries) throw new Error(`handbook: missing section ${String(key)}`);
      return {
        key,
        title,
        entries: entries.map((e) => {
          expectKeys(e, ["h", "p"], `handbook ${String(key)}`);
          return { heading: e.h, body: e.p };
        }),
      };
    }),
  )} satisfies HandbookSection[];\n`,
);

emit(
  "content/rule-of-play.ts",
  [
    `import type { RuleOfPlay } from "./schema";`,
    ``,
    `export const ruleOfPlay = ${literal({
      lines: raw.WORKSHEET.map((pair, i) => {
        if (!Array.isArray(pair) || pair.length !== 2) {
          throw new Error(
            `worksheet line ${i}: expected a [heading, hint] pair`,
          );
        }
        return { heading: pair[0], hint: pair[1] };
      }),
      closingLine: "One sentence I would want said about how I play",
      dailyPrompts: raw.PROMPTS,
    })} satisfies RuleOfPlay;`,
    ``,
  ].join("\n"),
);

emit(
  "content/units.ts",
  `export const units = ${literal(raw.UNITS)} as const;\n`,
);

console.log(
  `\nextracted ${sessions.length} sessions, ${raw.EXTRA_CASES.length} case-bank entries, ` +
    `${raw.RESOURCES.length} resource groups, ${raw.GLOSSARY.length} glossary terms, ` +
    `${raw.WORKSHEET.length} worksheet lines, ${raw.PROMPTS.length} daily prompts`,
);
