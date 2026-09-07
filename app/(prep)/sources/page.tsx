import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { PageHeader, SectionHeading } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { pages, resourceGroups, type Resource } from "@/content";
import { slug } from "@/lib/search-index";

export const metadata: Metadata = {
  title: "Sources",
  description:
    "Reference tools, Christian authors with their tradition named, and research used for facts rather than theology.",
};

const LEAN_STYLES: Record<Resource["lean"], string> = {
  reference: "bg-teal-lite text-teal",
  christian: "bg-brass-lite text-brass-ink-soft",
  secular: "bg-surface-2 text-ink-soft",
};

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Sources"
        lede={<Prose as="span" html={pages.sources.lede} />}
      />

      <Callout tone="clay">
        <Prose className="m-0" html={pages.sources.callout} />
      </Callout>

      {resourceGroups.map((group) => (
        <section key={group.group}>
          <SectionHeading id={slug(group.group)}>{group.group}</SectionHeading>
          <Prose className="max-w-[70ch]" html={group.note} />
          <ul className="my-3.5 list-none border-t border-rule p-0">
            {group.items.map((item) => (
              <li
                key={item.title}
                className="break-inside-avoid border-b border-rule py-3.5"
              >
                <div className="text-[15.5px] font-extrabold">
                  {item.title}
                  <span
                    className={`ml-2 inline-block rounded-[5px] px-1.5 py-0.5 align-[1.5px] text-[11px] font-normal ${LEAN_STYLES[item.lean]}`}
                  >
                    {item.leanLabel}
                  </span>
                </div>
                <div className="mt-0.5 mb-1.5 text-[12.5px] text-ink-faint-legible">
                  {item.where}
                </div>
                <Prose
                  className="m-0 max-w-[70ch] text-[14.5px] text-ink-soft"
                  html={item.description}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <SectionHeading>{pages.sources.closing.heading}</SectionHeading>
      <Prose className="max-w-[70ch]" html={pages.sources.closing.body} />
    </>
  );
}
