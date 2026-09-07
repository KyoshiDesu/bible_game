"use client";

import { useActionState } from "react";

import { createGroup } from "@/lib/actions/groups";
import { IDLE } from "@/lib/actions/result";

import { BUTTON, FIELD, FormNote } from "./form-note";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState(createGroup, IDLE);

  return (
    <form action={action} className="mt-4 max-w-sm">
      <label
        htmlFor="name"
        className="block text-sm font-extrabold text-ink-soft"
      >
        Name this group
      </label>
      <input
        id="name"
        name="name"
        placeholder="Tuesday evening"
        maxLength={80}
        required
        className={`${FIELD} mt-1.5`}
      />
      <button type="submit" className={`${BUTTON} mt-3`} disabled={pending}>
        {pending ? "Creating…" : "Create group"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
