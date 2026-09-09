import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { sessions } from "@/content";
import { findGroup } from "@/lib/db/groups";
import { listEntries } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Workbook" };

export default async function WorkbookIndex({
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

  const entries = await listEntries(supabase, groupId);
  const written = new Set(
    entries
      .filter((entry) => entry.body.trim() !== "")
      .map((entry) => entry.sessionNumber),
  );

  return (
    <>
      <h1 className="mt-8 font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        {group.name}
      </h1>
      <p className="mt-2 text-ink-soft">
        Your workbook. Nobody else can read what you write here — not the group,
        not your leader. They can see that you have written, and that is all.
      </p>

      <ol className="m-0 mt-6 list-none border-t border-rule p-0">
        {sessions.map((session) => (
          <li key={session.number} className="border-b border-rule">
            <Link
              href={`/me/${groupId}/session/${session.number}`}
              className="flex items-baseline gap-3 py-3 text-ink no-underline"
            >
              <span className="font-mono text-xs text-brass-legible">
                {String(session.number).padStart(2, "0")}
              </span>
              <span className="flex-1">{session.title}</span>
              {written.has(session.number) ? (
                <span className="rounded-full bg-teal-lite px-2 py-0.5 text-[11px] text-teal">
                  Written
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col gap-2">
        <Link href={`/me/${groupId}/rule`}>My rule of play</Link>
        <Link href={`/me/${groupId}/shared`}>Rules the group has shared</Link>
        <Link href="/me">Back</Link>
      </div>
    </>
  );
}
