import Link from "next/link";
import { redirect } from "next/navigation";
import { type Metadata } from "next";

import { StartMeetingForm } from "@/components/present/start-meeting-form";
import { scenarios, sessions } from "@/content";
import { listGroups } from "@/lib/db/groups";
import { liveRuns } from "@/lib/db/meetings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Run a meeting" };

export default async function PresentIndex() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const [groups, live] = await Promise.all([
    listGroups(supabase),
    liveRuns(supabase),
  ]);
  const led = groups.filter(
    (group) => group.leaderId === data.user?.id && group.archivedAt === null,
  );

  return (
    <main id="main" className="mx-auto max-w-3xl px-8 py-16">
      <h1 className="m-0 font-serif text-4xl leading-none font-semibold [font-variation-settings:'SOFT'_24,'WONK'_1]">
        Run a meeting
      </h1>
      <p className="mt-3 text-on-violet-soft">
        Put this screen on the projector. Everyone else votes from a phone —
        read out your join code first.
      </p>

      {live.length > 0 ? (
        <section className="mt-10">
          <h2 className="m-0 font-sans text-sm font-extrabold tracking-[0.06em] text-brass-on-violet uppercase">
            Already running
          </h2>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {live.map((run) => (
              <li key={run.id}>
                <Link href={`/present/${run.id}`} className="text-on-violet">
                  {run.groupName} — Session{" "}
                  {String(run.sessionNumber).padStart(2, "0")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {led.length === 0 ? (
        <p className="mt-10 text-on-violet-soft">
          You do not lead a group yet.{" "}
          <Link href="/groups" className="text-on-violet">
            Make one
          </Link>
          , then come back.
        </p>
      ) : (
        led.map((group) => (
          <section key={group.id} className="mt-10">
            <h2 className="m-0 font-serif text-2xl font-semibold">
              {group.name}
            </h2>
            <ul className="m-0 mt-4 list-none space-y-3 p-0">
              {scenarios.map((scenario) => {
                const session = sessions.find(
                  (candidate) => candidate.number === scenario.sessionNumber,
                );
                return (
                  <li
                    key={scenario.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 px-5 py-4"
                  >
                    <span>
                      <span className="font-mono text-sm text-brass-on-violet">
                        {String(scenario.sessionNumber).padStart(2, "0")}
                      </span>
                      <span className="ml-3">{session?.title}</span>
                      <span className="ml-3 text-on-violet-faint-legible">
                        {scenario.caseTitle}
                      </span>
                    </span>
                    <StartMeetingForm
                      groupId={group.id}
                      sessionNumber={scenario.sessionNumber}
                      scenarioId={scenario.id}
                      label="Start"
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 mb-0 text-sm text-on-violet-faint-legible">
              The other nine sessions are not playable yet. Their case studies
              are in the{" "}
              <Link href="/cases" className="text-on-violet-soft">
                case bank
              </Link>{" "}
              and run perfectly well on a show of hands.
            </p>
          </section>
        ))
      )}
    </main>
  );
}
