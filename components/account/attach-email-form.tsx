"use client";

import { useActionState } from "react";

import { attachEmail } from "@/lib/actions/join";
import { IDLE } from "@/lib/actions/result";

import { BUTTON, FIELD, FormNote } from "./form-note";

export function AttachEmailForm() {
  const [state, action, pending] = useActionState(attachEmail, IDLE);

  return (
    <form action={action} className="mt-4 max-w-sm">
      <label
        htmlFor="email"
        className="block text-sm font-extrabold text-ink-soft"
      >
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className={`${FIELD} mt-1.5`}
      />
      <button type="submit" className={`${BUTTON} mt-3`} disabled={pending}>
        {pending ? "Sending…" : "Send me a link"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
