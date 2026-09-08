import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { ruleOfPlay } from "@/content";
import { findGroup, roster } from "@/lib/db/groups";
import { listVisibleRules } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Shared rules of play" };

export default async function SharedRulesPage({
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

  const [rules, members] = await Promise.all([
    listVisibleRules(supabase, groupId),
    roster(supabase, groupId),
  ]);
  const names = new Map(
    members.map((member) => [member.profileId, member.displayName]),
  );

  // The caller's own row comes back whether or not it is shared; this page is
  // about what the group has offered each other.
  const shared = rules.filter((rule) => rule.shared);

  return (
    <>
      <h1 className="mt-8 font-serif text-3xl leading-tight font-semibold [font-variation-settings:'SOFT'_22,'WONK'_1]">
        Shared rules of play
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Only what people have chosen to share. Session 10 works better when some
        people volunteer.
      </p>

      {shared.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          Nobody has shared theirs yet.{" "}
          <Link href={`/me/${groupId}/rule`}>Yours</Link> is private until you
          say otherwise.
        </p>
      ) : (
        shared.map((rule) => (
          <article
            key={rule.profileId}
            className="mt-5 rounded-xl border border-rule bg-surface px-5 py-4"
          >
            <h2 className="mt-0 font-sans text-sm font-extrabold text-ink-soft">
              {names.get(rule.profileId) ?? "Someone"}
            </h2>
            {rule.oneSentence.trim() !== "" ? (
              <p className="mt-2 font-serif text-lg leading-snug">
                &ldquo;{rule.oneSentence}&rdquo;
              </p>
            ) : null}
            <dl className="mt-3">
              {ruleOfPlay.lines.map((line) =>
                rule.sections[line.heading]?.trim() ? (
                  <div key={line.heading} className="mt-2">
                    <dt className="text-xs font-extrabold text-ink-faint-legible">
                      {line.heading}
                    </dt>
                    <dd className="m-0 text-sm">
                      {rule.sections[line.heading]}
                    </dd>
                  </div>
                ) : null,
              )}
            </dl>
          </article>
        ))
      )}

      <p className="mt-8">
        <Link href={`/me/${groupId}`}>Back to the workbook</Link>
      </p>
    </>
  );
}
