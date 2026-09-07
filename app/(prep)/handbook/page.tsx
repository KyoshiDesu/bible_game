import Link from "next/link";
import { type Metadata } from "next";

import { PageHeader, SectionHeading } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { handbook, pages, sessions } from "@/content";
import { sessionHref, sessionLabel } from "@/lib/prep-nav";

export const metadata: Metadata = {
  title: "Leader's handbook",
  description:
    "Ground rules, timing, pastoral care, and how the material was built.",
};

export default function HandbookPage() {
  return (
    <>
      <PageHeader
        title="Leader's handbook"
        lede={<Prose as="span" html={pages.handbook.lede} />}
      />

      {handbook.map((section) => (
        <section key={section.key}>
          <SectionHeading id={section.key}>{section.title}</SectionHeading>
          {section.entries.map((entry) => (
            <div key={entry.heading}>
              <h3 className="mt-5 mb-2 font-sans text-[15px] font-extrabold text-ink-soft">
                {entry.heading}
              </h3>
              <Prose className="max-w-[70ch]" html={entry.body} />
            </div>
          ))}
        </section>
      ))}

      <SectionHeading>{pages.handbook.anchorTableHeading}</SectionHeading>
      <div className="overflow-x-auto">
        <table className="my-3.5 w-full border-collapse text-[14.5px]">
          <thead>
            <tr>
              <th className="w-9 border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                <span className="sr-only">Session number</span>
              </th>
              <th className="border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Session
              </th>
              <th className="border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Anchor
              </th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.number} className="hover:[&>td]:bg-surface">
                <td className="border-b border-rule px-2.5 py-2 align-top font-mono text-xs text-ink-faint-legible">
                  {sessionLabel(session.number)}
                </td>
                <td className="border-b border-rule px-2.5 py-2 align-top">
                  <Link href={sessionHref(session.number)}>
                    {session.title}
                  </Link>
                </td>
                <td className="border-b border-rule px-2.5 py-2 align-top">
                  {session.anchor.ref}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
