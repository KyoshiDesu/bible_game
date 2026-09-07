/**
 * The shape of the curriculum.
 *
 * Two rules govern this file, both carried from the implementation plan:
 *
 * 1. Every field the original curriculum always populates is required. A
 *    teaching note lost in extraction should fail `content:check`, not appear
 *    as a blank pane in front of a room.
 * 2. Prose fields are validated against the trusted-HTML allowlist. The
 *    curriculum carries authored markup — emphasis in a leader's script, a
 *    blockquote on a slide — and it is rendered as HTML. `authored` is what
 *    makes that safe; see lib/trusted-html.ts.
 */
import { z } from "zod";

import { findTrustedHtmlViolations } from "@/lib/trusted-html";

/** Prose that may carry authored markup. */
const authored = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    for (const violation of findTrustedHtmlViolations(value)) {
      ctx.addIssue({ code: "custom", message: `trusted-html: ${violation}` });
    }
  });

/** Prose that must not carry markup, because nothing renders it as HTML. */
const plain = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    if (value.includes("<")) {
      ctx.addIssue({ code: "custom", message: "markup in a plain-text field" });
    }
  });

/** A Scripture reference, stored bare. See lib/bible-gateway.ts. */
const reference = plain;

export const caseStudySchema = z.strictObject({
  title: plain,
  tagline: plain,
  story: authored,
  questions: z.array(authored).min(2),
  /** Leader-only. Never shown on the presenter or participant surface. */
  leaderKey: authored,
});

export const caseBankEntrySchema = z.strictObject({
  title: plain,
  tagline: plain,
  story: authored,
  questions: z.array(authored).min(2),
  /** The session this case belongs to first; the tagline names the others. */
  primarySession: z.number().int().min(1).max(10),
  /** Present only on cases that can land on someone in the room. */
  care: authored.optional(),
});

export const slideSchema = z.strictObject({
  kicker: plain,
  /** Empty on slides that are nothing but a Scripture quotation. */
  heading: z.string(),
  body: authored,
  /** Presenter notes. Never projected. */
  notes: authored,
});

export const planStepSchema = z.strictObject({
  /** Elapsed time at the start of the step, as `m:ss`. */
  clock: z.string().regex(/^\d:\d{2}$/),
  minutes: z.number().int().positive(),
  heading: plain,
  script: authored,
  bullets: z.array(authored),
});

export const sessionSchema = z.strictObject({
  number: z.number().int().min(1).max(10),
  unit: plain,
  title: plain,
  subtitle: plain,
  bigIdea: authored,
  icebreaker: z.strictObject({ title: plain, how: authored, why: authored }),
  anchor: z.strictObject({ ref: reference, text: authored, gist: authored }),
  support: z.array(z.strictObject({ ref: reference, gist: authored })).min(1),
  teaching: z
    .array(z.strictObject({ heading: plain, points: z.array(authored).min(1) }))
    .min(1),
  plan: z.array(planStepSchema).min(1),
  cases: z.array(caseStudySchema).min(1),
  discussion: z.array(authored).min(3),
  takeHome: z.strictObject({
    challenge: authored,
    practice: authored,
    prep: authored,
  }),
  slides: z.array(slideSchema).min(1),
});

export const overviewSchema = z.strictObject({
  lede: authored,
  /** The unit band under the semester track; spans sum to the ten sessions. */
  units: z.array(
    z.strictObject({ span: z.number().int().positive(), label: plain }),
  ),
  argument: z.strictObject({ heading: plain, body: authored }),
  /** The one thing to protect, as a callout. */
  protect: authored,
  shape: z.strictObject({
    heading: plain,
    rows: z.array(
      z.strictObject({ minutes: plain, segment: plain, purpose: authored }),
    ),
    note: authored,
  }),
  startHere: z.strictObject({
    heading: plain,
    cards: z.array(
      z.strictObject({
        heading: plain,
        body: authored,
        linkHref: plain,
        linkLabel: plain,
      }),
    ),
  }),
});

export const pageCopySchema = z.strictObject({
  caseBank: z.strictObject({ lede: authored, callout: authored }),
  sources: z.strictObject({
    lede: authored,
    callout: authored,
    closing: z.strictObject({ heading: plain, body: authored }),
  }),
  handbook: z.strictObject({ lede: authored, anchorTableHeading: plain }),
  ruleOfPlay: z.strictObject({
    lede: authored,
    callout: authored,
    worksheetHeading: plain,
    /** The "written on … reviewed on … with …" line, printed with blanks. */
    dated: plain,
    promptsHeading: plain,
    promptsNote: authored,
  }),
});

export const resourceSchema = z.strictObject({
  title: plain,
  /** Publisher and year, or a domain — whichever identifies the source. */
  where: plain,
  /**
   * Where the source is written from. The curriculum labels rather than claims
   * neutrality, so this is required on every entry.
   */
  lean: z.enum(["reference", "christian", "secular"]),
  leanLabel: plain,
  description: authored,
});

export const resourceGroupSchema = z.strictObject({
  group: plain,
  note: authored,
  items: z.array(resourceSchema).min(1),
});

export const glossaryEntrySchema = z.strictObject({
  term: plain,
  definition: authored,
});

export const handbookSectionSchema = z.strictObject({
  key: z.enum(["shape", "running", "care", "sourcing"]),
  title: plain,
  entries: z.array(z.strictObject({ heading: plain, body: authored })).min(1),
});

export const ruleOfPlaySchema = z.strictObject({
  lines: z.array(z.strictObject({ heading: plain, hint: authored })).min(1),
  closingLine: plain,
  dailyPrompts: z.array(authored).min(1),
});

export type CaseStudy = z.infer<typeof caseStudySchema>;
export type CaseBankEntry = z.infer<typeof caseBankEntrySchema>;
export type Slide = z.infer<typeof slideSchema>;
export type PlanStep = z.infer<typeof planStepSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Overview = z.infer<typeof overviewSchema>;
export type PageCopy = z.infer<typeof pageCopySchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type ResourceGroup = z.infer<typeof resourceGroupSchema>;
export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
export type HandbookSection = z.infer<typeof handbookSectionSchema>;
export type RuleOfPlay = z.infer<typeof ruleOfPlaySchema>;
