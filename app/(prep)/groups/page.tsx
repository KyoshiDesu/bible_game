import Link from "next/link";
import { redirect } from "next/navigation";
import { type Metadata } from "next";

import { CreateGroupForm } from "@/components/account/create-group-form";
import { DisplayNameForm } from "@/components/account/display-name-form";
import { Callout } from "@/components/prep/callout";
import { PageHeader, SectionHeading } from "@/components/prep/page-header";
import { findProfile, listGroups } from "@/lib/db/groups";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My groups",
  description: "Create a group, share its code, and see who has joined.",
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");
  if (data.user.is_anonymous) redirect("/me");

  const profile = await findProfile(supabase, data.user.id);
  if (!profile) {
    return (
      <>
        <PageHeader
          title="One thing first"
          lede="Your group will see this name beside anything you write, so pick the one they know you by."
        />
        <DisplayNameForm />
      </>
    );
  }

  const groups = await listGroups(supabase);
  const active = groups.filter((group) => group.archivedAt === null);
  const archived = groups.filter((group) => group.archivedAt !== null);

  return (
    <>
      <PageHeader
        title="My groups"
        lede="A group is a room that meets on this curriculum. Give people its code and they can join with a name and nothing else."
      />

      {active.length === 0 ? (
        <Callout>
          <p className="m-0">
            Nothing here yet. Create a group, then read the leader&rsquo;s
            handbook before your first session.
          </p>
        </Callout>
      ) : (
        <ul className="m-0 mt-6 list-none space-y-3 p-0">
          {active.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-surface px-5 py-4 shadow-press"
            >
              <Link
                href={`/groups/${group.id}`}
                className="font-semibold no-underline"
              >
                {group.name}
              </Link>
              <span className="font-mono text-sm tracking-[0.2em] text-ink-faint-legible">
                {group.joinCode}
              </span>
            </li>
          ))}
        </ul>
      )}

      <SectionHeading>Create a group</SectionHeading>
      <CreateGroupForm />

      {archived.length > 0 ? (
        <>
          <SectionHeading>Archived</SectionHeading>
          <ul className="m-0 list-none space-y-2 p-0 text-ink-soft">
            {archived.map((group) => (
              <li key={group.id}>
                <Link href={`/groups/${group.id}`}>{group.name}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
