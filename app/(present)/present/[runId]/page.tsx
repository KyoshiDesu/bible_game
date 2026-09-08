import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { Presenter } from "@/components/present/presenter";
import { findScenario } from "@/content";
import { findGroup } from "@/lib/db/groups";
import { findRun, memberCount, roomState } from "@/lib/db/meetings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Presenting" };

/**
 * The projector, server-rendered before any socket exists.
 *
 * This is the degradation story's foundation rather than an optimisation: a
 * leader whose realtime connection has died can refresh and get the true state
 * of the meeting, because the true state was never in the browser.
 */
export default async function PresentRun({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in");

  const run = await findRun(supabase, runId);
  if (!run) notFound();

  const group = await findGroup(supabase, run.groupId);
  // A participant who followed the projector's URL gets their own screen
  // rather than the controls.
  if (group?.leaderId !== data.user.id) redirect(`/room/${runId}`);

  const scenario = findScenario(run.scenarioId);
  if (!scenario) {
    return (
      <main id="main" className="mx-auto max-w-2xl px-8 py-24">
        <h1 className="m-0 font-serif text-3xl font-semibold">
          This meeting is running a scenario this version does not have
        </h1>
        <p className="mt-4 text-on-violet-soft">
          It is running <code className="font-mono">{run.scenarioId}</code>.
          Update the application, or run the case study on a show of hands from
          the{" "}
          <Link href="/cases" className="text-on-violet">
            case bank
          </Link>
          .
        </p>
      </main>
    );
  }

  const [state, members] = await Promise.all([
    roomState(supabase, run),
    memberCount(supabase, run.groupId),
  ]);

  return (
    <Presenter
      scenario={scenario}
      initialState={state}
      meetingId={run.meetingId}
      groupId={run.groupId}
      groupName={run.groupName}
      sessionNumber={run.sessionNumber}
      memberCount={members}
      presenceKey={data.user.id}
    />
  );
}
