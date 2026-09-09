import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { RuleEditor, ShareToggle } from "@/components/workbook/rule-editor";
import { pages, ruleOfPlay } from "@/content";
import { findGroup } from "@/lib/db/groups";
import { findRuleOfPlay } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My rule of play" };

export default async function RuleOfPlayPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/join");

  const group = await findGroup(supabase, groupId);
  if (!group) notFound();

  const rule = await findRuleOfPlay(supabase, groupId, data.user.id);

  return (
    <>
      <h1 className="mt-8 font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        My rule of play
      </h1>
      <p
        className="mt-2 text-sm text-ink-soft"
        dangerouslySetInnerHTML={{ __html: pages.ruleOfPlay.callout }}
      />

      <RuleEditor
        groupId={groupId}
        lines={ruleOfPlay.lines}
        closingLine={ruleOfPlay.closingLine}
        rule={rule}
      />

      <section className="mt-8 border-t border-rule pt-5">
        <h2 className="font-sans text-sm font-extrabold text-ink-soft">
          {rule?.shared ? "Your group can read this" : "Only you can read this"}
        </h2>
        <p className="mt-1 text-sm">
          Sharing is yours to decide and yours to undo. Your leader cannot share
          it for you, and cannot read it until you do.
        </p>
        <ShareToggle groupId={groupId} shared={rule?.shared ?? false} />
      </section>

      <p className="mt-8">
        <Link href={`/me/${groupId}`}>Back to the workbook</Link>
      </p>
    </>
  );
}
