import Link from "next/link";

import { SectionHeading } from "@/components/prep/page-header";
import { PlanTimeline } from "@/components/prep/plan-timeline";
import { Prose } from "@/components/prep/prose";
import { glossary } from "@/content";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

export default async function LessonPlanPane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  return (
    <>
      <SectionHeading>Icebreaker · {session.icebreaker.title}</SectionHeading>
      <p className="max-w-[70ch]">
        <b>How it runs.</b> <Prose as="span" html={session.icebreaker.how} />
      </p>
      <p className="max-w-[70ch]">
        <b>Why this one.</b> <Prose as="span" html={session.icebreaker.why} />
      </p>

      <SectionHeading>The forty minutes</SectionHeading>
      <PlanTimeline steps={session.plan} />

      <SectionHeading>Teaching notes</SectionHeading>
      {session.teaching.map((note) => (
        <section key={note.heading}>
          <h3 className="mt-5 mb-2 font-sans text-[15px] font-extrabold text-ink-soft">
            {note.heading}
          </h3>
          {note.points.map((point) => (
            <Prose key={point} className="max-w-[70ch]" html={point} />
          ))}
        </section>
      ))}

      {session.number === 6 ? (
        <>
          <SectionHeading>Monetization glossary</SectionHeading>
          <p>
            Use these for the icebreaker: read the definition, let the group
            name the term.
          </p>
          <ul className="my-3 list-none p-0">
            {glossary.map((entry) => (
              <li
                key={entry.term}
                className="grid gap-3.5 border-t border-rule py-2.5 text-[14.5px] md:grid-cols-[180px_1fr]"
              >
                <b className="text-[13.5px] font-extrabold text-brass-legible">
                  {entry.term}
                </b>
                <Prose as="span" html={entry.definition} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {session.number === 10 ? (
        <>
          <SectionHeading>The rule of play worksheet</SectionHeading>
          <p className="max-w-[70ch]">
            The template is on its own page so you can print it for the group
            before you arrive.{" "}
            <Link href="/rule-of-play">Open the worksheet</Link>
          </p>
        </>
      ) : null}
    </>
  );
}
