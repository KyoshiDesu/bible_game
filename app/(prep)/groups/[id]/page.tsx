import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import {
  ArchiveGroupForm,
  RemoveMemberForm,
  RenameGroupForm,
  RotateCodeForm,
} from "@/components/account/group-controls";
import { Callout } from "@/components/prep/callout";
import { PageHeader, SectionHeading } from "@/components/prep/page-header";
import { findGroup, roster } from "@/lib/db/groups";
import { liveRunForGroup } from "@/lib/db/meetings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Group" };

export default async function GroupPage({
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

  const [members, live] = await Promise.all([
    roster(supabase, group.id),
    liveRunForGroup(supabase, group.id),
  ]);
  const leads = group.leaderId === data.user.id;

  return (
    <>
      <PageHeader
        title={group.name}
        lede={
          group.archivedAt
            ? "Archived. Its code has been released, and nobody new can join."
            : "Read the code out at the start of the meeting. Anyone with it can join with a name and nothing else."
        }
      />

      {group.archivedAt === null ? (
        <div className="mt-6 rounded-xl bg-violet-deep px-6 py-5 text-on-violet">
          <p className="m-0 text-xs font-bold tracking-[0.06em] text-brass-on-violet uppercase">
            Join code
          </p>
          <p className="m-0 font-mono text-4xl tracking-[0.35em]">
            {group.joinCode}
          </p>
          <p className="m-0 mt-2 text-sm text-on-violet-soft">
            Participants go to <b>/join</b> and type it in.
          </p>
        </div>
      ) : null}

      {leads && group.archivedAt === null ? (
        <p className="mt-5 mb-0">
          {live ? (
            <Link href={`/present/${live.id}`}>
              Session {String(live.sessionNumber).padStart(2, "0")} is running —
              back to the projector
            </Link>
          ) : (
            <Link href="/present">Run a meeting on the projector</Link>
          )}
        </p>
      ) : null}

      <SectionHeading>Who has joined ({members.length})</SectionHeading>
      {leads ? (
        <p className="mt-0 mb-3 text-sm">
          <Link href={`/groups/${group.id}/engagement`}>
            See who has written in their workbook
          </Link>{" "}
          — counts and names, never what they wrote.
        </p>
      ) : null}
      <ul className="m-0 list-none border-t border-rule p-0">
        {members.map((member) => (
          <li
            key={member.profileId}
            className="flex items-center justify-between gap-4 border-b border-rule py-3"
          >
            <span>
              {member.displayName}
              {member.role === "leader" ? (
                <span className="ml-2 rounded-[5px] bg-brass-lite px-1.5 py-0.5 text-[11px] text-brass-ink-soft">
                  Leader
                </span>
              ) : null}
            </span>
            {leads && member.role !== "leader" ? (
              <RemoveMemberForm
                groupId={group.id}
                profileId={member.profileId}
                displayName={member.displayName}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {leads ? (
        <>
          <SectionHeading>Manage</SectionHeading>
          <RenameGroupForm groupId={group.id} name={group.name} />
          <div className="mt-5 flex flex-wrap gap-3">
            <RotateCodeForm groupId={group.id} />
            <ArchiveGroupForm
              groupId={group.id}
              archived={group.archivedAt !== null}
            />
          </div>
          <Callout>
            <p className="m-0">
              Rotating the code stops anyone still holding the old one from
              joining. Archiving keeps the group and everything written in it,
              releases the code, and closes it to new members.
            </p>
          </Callout>
        </>
      ) : null}
    </>
  );
}
