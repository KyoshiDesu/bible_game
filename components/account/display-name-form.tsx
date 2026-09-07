"use client";

import { useActionState } from "react";

import { setDisplayName } from "@/lib/actions/auth";
import { IDLE } from "@/lib/actions/result";

import { BUTTON, FIELD, FormNote } from "./form-note";

export function DisplayNameForm({ current }: { current?: string }) {
  const [state, action, pending] = useActionState(setDisplayName, IDLE);

  return (
    <form action={action} className="mt-4 max-w-sm">
      <label
        htmlFor="displayName"
        className="block text-sm font-extrabold text-ink-soft"
      >
        What should the group call you?
      </label>
      <input
        id="displayName"
        name="displayName"
        defaultValue={current}
        maxLength={60}
        required
        className={`${FIELD} mt-1.5`}
      />
      <button type="submit" className={`${BUTTON} mt-3`} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
