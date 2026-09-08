"use client";

import { type Connection } from "@/lib/room/client";

/**
 * The banner the design insists on.
 *
 * A projector showing stale state confidently is worse than one showing an
 * error, because the room believes it and so does the leader. This says what
 * happened and what still works — refreshing re-reads the meeting from the
 * database, and the leader's own controls go through the server rather than
 * the socket, so the session can be driven the whole way through with this
 * banner on screen.
 */
export function ConnectionBanner({
  connection,
  onRefresh,
  refreshing,
  deckHref,
}: {
  connection: Connection;
  onRefresh: () => void;
  refreshing: boolean;
  deckHref: string;
}) {
  if (connection !== "lost") return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-clay/60 bg-clay px-6 py-3 text-on-violet"
    >
      <span className="font-sans text-sm font-bold">
        Live updates have stopped.
      </span>
      <span className="text-sm text-on-violet-warm">
        Your controls still work. Refresh to catch up.
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-md bg-on-violet px-3 py-1 text-sm font-semibold text-clay-ink disabled:opacity-60"
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <a href={deckHref} className="text-sm text-on-violet underline">
        Or run it on a show of hands
      </a>
    </div>
  );
}
