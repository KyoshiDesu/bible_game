import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { type Metadata } from "next";

import { Room } from "@/components/play/room";
import { findScenario } from "@/content";
import { findRun, ownVote, roomState } from "@/lib/db/meetings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "The room" };

export default async function RoomPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/join");

  // Row-level security answers "is this yours to see"; a run in someone else's
  // group simply is not there.
  const run = await findRun(supabase, runId);
  if (!run) notFound();

  const scenario = findScenario(run.scenarioId);
  if (!scenario) {
    return (
      <>
        <h1 className="mt-8 font-serif text-2xl font-semibold">
          This session needs a newer version
        </h1>
        <p className="mt-3 text-ink-soft">
          Your leader is running something this app does not have yet. Look up —
          the screen at the front still works.
        </p>
        <p className="mt-6">
          <Link href={`/me/${run.groupId}`}>Your workbook</Link>
        </p>
      </>
    );
  }

  const [state, choice] = await Promise.all([
    roomState(supabase, run),
    ownVote(supabase, runId, run.currentBeat),
  ]);

  return (
    <Room
      scenario={scenario}
      initialState={state}
      groupId={run.groupId}
      groupName={run.groupName}
      presenceKey={data.user.id}
      initialChoice={choice}
    />
  );
}
