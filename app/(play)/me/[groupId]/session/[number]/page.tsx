import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { AutosaveField } from "@/components/workbook/autosave-field";
import { findSession } from "@/content";
import { findGroup } from "@/lib/db/groups";
import { entriesForSession } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Session workbook" };

export default async function SessionWorkbook({
  params,
}: {
  params: Promise<{ groupId: string; number: string }>;
}) {
  const { groupId, number } = await params;
  const session = findSession(Number(number));
  if (!session) notFound();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/join");

  const group = await findGroup(supabase, groupId);
  if (!group) notFound();

  const bodies = await entriesForSession(supabase, groupId, session.number);

  return (
    <>
      <p className="mt-8 font-mono text-xs text-ink-faint-legible">
        Session {String(session.number).padStart(2, "0")}
      </p>
      <h1 className="font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        {session.title}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Saved as you write. Only you can read this.
      </p>

      <AutosaveField
        groupId={groupId}
        sessionNumber={session.number}
        kind="reflection"
        label="Anything you want to keep"
        prompt="What you thought, what you disagreed with, what you would rather not have noticed."
        initial={bodies.reflection}
      />

      <AutosaveField
        groupId={groupId}
        sessionNumber={session.number}
        kind="challenge"
        label="Challenge"
        prompt={session.takeHome.challenge.replace(/<[^>]*>/g, "")}
        initial={bodies.challenge}
      />

      <AutosaveField
        groupId={groupId}
        sessionNumber={session.number}
        kind="practice"
        label="Practice"
        prompt={session.takeHome.practice.replace(/<[^>]*>/g, "")}
        initial={bodies.practice}
      />

      <p className="mt-8">
        <Link href={`/me/${groupId}`}>Back to the workbook</Link>
      </p>
    </>
  );
}
