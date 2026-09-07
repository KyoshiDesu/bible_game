import Link from "next/link";
import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { PageHeader } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { SemesterTrack } from "@/components/prep/semester-track";
import { overview } from "@/content";

export const metadata: Metadata = {
  title: "Press Start",
  description:
    "Ten sessions on video games, technology, and the life of faith, for a small group semester.",
};

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Press Start"
        lede={<Prose as="span" html={overview.lede} />}
      />

      <SemesterTrack />

      <h2 className="mt-9 mb-2.5 font-serif text-[23px] leading-[1.18] font-semibold">
        {overview.argument.heading}
      </h2>
      <Prose className="max-w-[70ch]" html={overview.argument.body} />

      <Callout tone="brass">
        <Prose className="m-0" html={overview.protect} />
      </Callout>

      <h2 className="mt-9 mb-2.5 font-serif text-[23px] leading-[1.18] font-semibold">
        {overview.shape.heading}
      </h2>
      <div className="overflow-x-auto">
        <table className="my-3.5 w-full border-collapse text-[14.5px]">
          <thead>
            <tr>
              <th className="w-20 border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Minutes
              </th>
              <th className="border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Segment
              </th>
              <th className="border-b border-rule px-2.5 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody>
            {overview.shape.rows.map((row) => (
              <tr key={row.minutes} className="hover:[&>td]:bg-surface">
                <td className="border-b border-rule px-2.5 py-2 align-top whitespace-nowrap">
                  {row.minutes}
                </td>
                <td className="border-b border-rule px-2.5 py-2 align-top">
                  {row.segment}
                </td>
                <td className="border-b border-rule px-2.5 py-2 align-top">
                  <Prose as="span" html={row.purpose} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose className="mt-3.5" html={overview.shape.note} />

      <h2 className="mt-9 mb-2.5 font-serif text-[23px] leading-[1.18] font-semibold">
        {overview.startHere.heading}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {overview.startHere.cards.map((card) => (
          <div
            key={card.heading}
            className="rounded-xl border border-rule bg-surface px-5 py-[18px] shadow-press"
          >
            <h3 className="mt-0 mb-2 font-sans text-[15px] font-extrabold text-ink-soft">
              {card.heading}
            </h3>
            <p className="m-0 text-[14.5px]">
              <Prose as="span" html={card.body} />{" "}
              <Link href={card.linkHref}>{card.linkLabel}</Link>
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
