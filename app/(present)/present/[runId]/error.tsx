"use client";

import { useEffect } from "react";
import Link from "next/link";

import { scenarios } from "@/content";

/**
 * When the meeting cannot be reached at all.
 *
 * Church halls have bad wifi and the meeting does not stop for an outage, so
 * this is not an apology page: every scenario is already in this bundle, and
 * the deck below runs the same case study on a show of hands with no database
 * involved. Saying that plainly is worth more than a retry button, though
 * there is one of those too.
 */
export default function PresentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="mx-auto max-w-2xl px-8 py-24">
      <h1 className="m-0 font-serif text-4xl leading-tight font-semibold">
        The meeting could not be reached
      </h1>
      <p className="mt-4 text-lg text-on-violet-soft">
        Voting needs the network and the network is not there. Nothing has been
        lost — the run is in the database exactly as you left it.
      </p>
      <p className="mt-2 text-lg text-on-violet-soft">
        Carry on without it: the case studies are part of this page, so you can
        read the beats out and take a show of hands.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/25 px-5 py-2.5 font-sans font-semibold text-on-violet"
        >
          Try again
        </button>
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/deck/${scenario.id}`}
            className="rounded-lg bg-brass px-5 py-2.5 font-sans font-extrabold text-brass-ink-strong no-underline"
          >
            {scenario.caseTitle}, on a show of hands
          </Link>
        ))}
      </div>
    </main>
  );
}
