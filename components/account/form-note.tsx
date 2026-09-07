import { type ActionState } from "@/lib/actions/result";

/** What an action said, under the form that ran it. */
export function FormNote({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="mt-3 rounded-lg bg-clay-lite px-3 py-2 text-sm text-clay-ink"
      >
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p
        role="status"
        className="mt-3 rounded-lg bg-teal-lite px-3 py-2 text-sm text-teal"
      >
        {state.message}
      </p>
    );
  }
  return null;
}

export const FIELD =
  "border-rule bg-surface text-ink w-full rounded-lg border px-3 py-2 text-base";

export const BUTTON =
  "bg-violet-mid text-on-violet hover:bg-ink rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60";

export const QUIET_BUTTON =
  "border-rule bg-surface text-ink hover:border-ink-faint rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:opacity-60";
