import Link from "next/link";
import { redirect } from "next/navigation";
import { type Metadata } from "next";

import { AttachEmailForm } from "@/components/account/attach-email-form";
import { signOut } from "@/lib/actions/auth";
import { findProfile, listGroups } from "@/lib/db/groups";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "You",
  description: "The groups you have joined, and how to keep what you write.",
};

export default async function MePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/join");

  const [profile, groups] = await Promise.all([
    findProfile(supabase, data.user.id),
    listGroups(supabase),
  ]);
  const active = groups.filter((group) => group.archivedAt === null);
  const anonymous = data.user.is_anonymous ?? false;

  return (
    <>
      <h1 className="mt-8 font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        {profile?.displayName ?? "You"}
      </h1>

      <h2 className="mt-6 font-sans text-sm font-extrabold text-ink-soft">
        Your groups
      </h2>
      {active.length === 0 ? (
        <p className="mt-2 text-ink-soft">
          You are not in a group yet.{" "}
          <Link href="/join">Join with a code.</Link>
        </p>
      ) : (
        <ul className="m-0 mt-2 list-none border-t border-rule p-0">
          {active.map((group) => (
            <li key={group.id} className="border-b border-rule py-3">
              {group.name}
            </li>
          ))}
        </ul>
      )}

      {anonymous ? (
        <section className="mt-8 rounded-xl border border-rule bg-surface px-5 py-4">
          <h2 className="mt-0 font-sans text-sm font-extrabold text-ink-soft">
            Keep what you write
          </h2>
          <p className="mt-2 mb-0 text-sm">
            Right now this device is the only thing holding your account. Add an
            email and everything you have written stays yours — on a new phone,
            or after this one is wiped. Nothing you write becomes visible to
            anyone else.
          </p>
          <AttachEmailForm />
        </section>
      ) : (
        <p className="mt-8 text-sm text-ink-soft">
          Signed in as {data.user.email}. What you write is tied to this
          account, not to this device.
        </p>
      )}

      <form action={signOut} className="mt-10">
        <button
          type="submit"
          className="text-sm font-semibold text-ink-soft underline underline-offset-2"
        >
          Sign out on this device
        </button>
      </form>
    </>
  );
}
