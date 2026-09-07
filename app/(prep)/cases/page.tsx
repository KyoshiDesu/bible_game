import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { CaseStudyCard } from "@/components/prep/case-study";
import { PageHeader } from "@/components/prep/page-header";
import { Prose } from "@/components/prep/prose";
import { caseBank, pages } from "@/content";

export const metadata: Metadata = {
  title: "Case bank",
  description:
    "Additional scenarios, beyond the two attached to each session, for when a case doesn't fit the room.",
};

export default function CaseBankPage() {
  return (
    <>
      <PageHeader
        title="Case bank"
        lede={<Prose as="span" html={pages.caseBank.lede} />}
      />

      <Callout>
        <Prose className="m-0" html={pages.caseBank.callout} />
      </Callout>

      {caseBank.map((study) => (
        <CaseStudyCard key={study.title} study={study} />
      ))}
    </>
  );
}
