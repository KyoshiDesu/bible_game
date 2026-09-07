import { type CaseBankEntry, type CaseStudy } from "@/content";
import { slug } from "@/lib/search-index";

import { Prose } from "./prose";

interface CaseStudyCardProps {
  study: CaseStudy | CaseBankEntry;
}

/**
 * A case study. The leader's key is rendered when there is one — the prep
 * surface is the leader's, and no participant route imports this.
 */
export function CaseStudyCard({ study }: CaseStudyCardProps) {
  const leaderKey = "leaderKey" in study ? study.leaderKey : undefined;
  const care = "care" in study ? study.care : undefined;

  return (
    <article
      id={slug(study.title)}
      className="my-4 scroll-mt-20 rounded-r-xl border border-l-4 border-rule border-l-violet-mid bg-surface px-[22px] py-[18px] shadow-press"
    >
      <h3 className="m-0 mb-1 font-serif text-xl font-semibold">
        {study.title}
      </h3>
      <p className="m-0 mb-3 text-xs text-ink-faint-legible">{study.tagline}</p>
      <Prose
        className="mt-0 mb-3 text-[15.5px] leading-[1.6]"
        html={study.story}
      />
      <ol className="m-0 list-decimal pl-5 text-[15px]">
        {study.questions.map((question) => (
          <li key={question} className="py-[3px]">
            <Prose as="span" html={question} />
          </li>
        ))}
      </ol>
      {leaderKey ? (
        <Prose
          className="mt-3 rounded-lg bg-brass-lite px-3.5 py-3 text-sm text-brass-ink [&_b]:text-brass-ink-strong"
          html={leaderKey}
        />
      ) : null}
      {care ? (
        <div className="mt-3 rounded-lg bg-clay-lite px-3.5 py-3 text-sm text-clay-ink">
          <b>Pastoral care:</b> <Prose as="span" html={care} />
        </div>
      ) : null}
    </article>
  );
}
