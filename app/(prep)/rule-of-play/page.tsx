import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { PageHeader, SectionHeading } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { QuestionList } from "@/components/prep/question-list";
import { pages, ruleOfPlay } from "@/content";

export const metadata: Metadata = {
  title: "Rule of play",
  description:
    "The printable worksheet that closes Session 10, plus two weeks of daily prompts.",
};

/** A pair of dotted lines to write on. Present on screen and in print. */
function WritingLines() {
  return (
    <>
      <div className="my-2 h-[30px] border-b-[1.5px] border-dotted border-ink-faint" />
      <div className="my-2 h-[30px] border-b-[1.5px] border-dotted border-ink-faint" />
    </>
  );
}

export default function RuleOfPlayPage() {
  return (
    <>
      <PageHeader
        title="Rule of play"
        lede={<Prose as="span" html={pages.ruleOfPlay.lede} />}
      />

      <Callout>
        <Prose className="m-0" html={pages.ruleOfPlay.callout} />
      </Callout>

      <section className="my-4 rounded-xl border border-rule bg-surface px-6 py-[22px] print:border-0 print:px-0">
        <h2 className="mt-0 mb-2 font-sans text-[15px] font-extrabold text-ink-soft">
          {pages.ruleOfPlay.worksheetHeading}
        </h2>
        <p className="text-[13.5px] text-ink-faint-legible">
          {pages.ruleOfPlay.dated}
        </p>

        {ruleOfPlay.lines.map((line) => (
          <div key={line.heading} className="break-inside-avoid">
            <h3 className="mt-5 mb-1 font-sans text-[15px] font-extrabold text-ink-soft">
              {line.heading}
            </h3>
            <Prose
              className="m-0 mb-1 text-[13.5px] text-ink-faint-legible"
              html={line.hint}
            />
            <WritingLines />
          </div>
        ))}

        <div className="break-inside-avoid">
          <h3 className="mt-5 mb-1 font-sans text-[15px] font-extrabold text-ink-soft">
            {ruleOfPlay.closingLine}
          </h3>
          <WritingLines />
        </div>
      </section>

      <SectionHeading>{pages.ruleOfPlay.promptsHeading}</SectionHeading>
      <Prose className="max-w-[70ch]" html={pages.ruleOfPlay.promptsNote} />
      <QuestionList items={ruleOfPlay.dailyPrompts} />
    </>
  );
}
