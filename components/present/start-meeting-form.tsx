"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { startMeeting } from "@/lib/actions/room";

/**
 * Starting a meeting.
 *
 * One button, because this is pressed with a room already sitting down. The
 * RPC behind it writes the meeting and its first run together and ends
 * whatever else was live in the group, so pressing it twice leaves one live
 * meeting rather than two.
 */
export function StartMeetingForm({
  groupId,
  sessionNumber,
  scenarioId,
  label,
}: {
  groupId: string;
  sessionNumber: number;
  scenarioId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await startMeeting(
              groupId,
              sessionNumber,
              scenarioId,
            );
            if (result.ok) router.push(`/present/${result.runId}`);
            else setError(result.reason);
          });
        }}
        className="rounded-lg bg-brass px-5 py-2.5 font-sans font-extrabold text-brass-ink-strong disabled:opacity-60"
      >
        {pending ? "Starting…" : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 mb-0 text-sm text-on-violet-warm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
