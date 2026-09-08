import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { Callout } from "@/components/prep/callout";
import { PageHeader } from "@/components/prep/page-header";
import { sessions } from "@/content";
import { findGroup } from "@/lib/db/groups";
import { groupEngagement } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Engagement" };

export default async function EngagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const group = await findGroup(supabase, id);
  if (!group) notFound();
  if (group.leaderId !== data.user.id) notFound();

  const rows = await groupEngagement(supabase, id);

  return (
    <>
      <PageHeader
        title="Who has written"
        lede={`${group.name} — a count per session, so you know who to ask after and who to leave be.`}
      />

      <Callout tone="brass">
        <p className="m-0">
          <b>You cannot read any of it, and that is deliberate.</b> This is a
          curriculum where Session 6 is about four hundred dollars and Session 4
          is about a short fuse. People write honestly here because nobody is
          reading it. What you see is that someone wrote — never a word of what.
        </p>
      </Callout>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-[14.5px]">
          <thead>
            <tr>
              <th className="border-b border-rule px-2 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Who
              </th>
              {sessions.map((session) => (
                <th
                  key={session.number}
                  scope="col"
                  className="border-b border-rule px-1 py-2 text-center font-mono text-[11px] font-extrabold text-ink-faint-legible"
                >
                  <abbr title={session.title} className="no-underline">
                    {String(session.number).padStart(2, "0")}
                  </abbr>
                </th>
              ))}
              <th className="border-b border-rule px-2 py-2 text-left text-[12.5px] font-extrabold text-ink-faint-legible">
                Rule of play
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.profileId} className="hover:[&>td]:bg-surface">
                <td className="border-b border-rule px-2 py-2 whitespace-nowrap">
                  {row.displayName}
                  {row.role === "leader" ? (
                    <span className="ml-2 text-[11px] text-ink-faint-legible">
                      you
                    </span>
                  ) : null}
                </td>
                {sessions.map((session) => {
                  const written =
                    row.sessionsWritten[String(session.number)] ?? 0;
                  return (
                    <td
                      key={session.number}
                      className="border-b border-rule px-1 py-2 text-center"
                    >
                      {written > 0 ? (
                        <span
                          className="inline-block rounded-full bg-teal-lite px-1.5 py-0.5 font-mono text-[11px] text-teal"
                          title={`${written} of 3 written`}
                        >
                          {written}
                        </span>
                      ) : (
                        <span
                          className="text-ink-faint-legible"
                          aria-label="nothing yet"
                        >
                          ·
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-rule px-2 py-2 whitespace-nowrap">
                  {row.ruleOfPlayWritten ? (
                    <>
                      Written
                      {row.ruleOfPlayShared ? (
                        <span className="ml-2 text-[11px] text-teal">
                          shared
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-faint-legible">·</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6">
        <Link href={`/groups/${group.id}`}>Back to {group.name}</Link>
      </p>
    </>
  );
}
