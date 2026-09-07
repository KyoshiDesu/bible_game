import Link from "next/link";

import { CaseStudyCard } from "@/components/prep/case-study";
import { caseBank } from "@/content";
import { sessionFromParams, type SessionParams } from "@/lib/prep-session";

export default async function CasesPane({ params }: SessionParams) {
  const session = await sessionFromParams(params);

  return (
    <>
      <p className="mt-4 max-w-[64ch] text-base text-ink-soft">
        Two cases. Use one; the second is there in case the first doesn&rsquo;t
        fit your room.
      </p>

      {session.cases.map((study) => (
        <CaseStudyCard key={study.title} study={study} />
      ))}

      <p>
        <Link href="/cases">
          {caseBank.length} more scenarios in the case bank
        </Link>
      </p>
    </>
  );
}
