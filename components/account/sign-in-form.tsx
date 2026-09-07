"use client";

import { useActionState } from "react";

import { requestMagicLink } from "@/lib/actions/auth";
import { IDLE } from "@/lib/actions/result";

import { BUTTON, FIELD, FormNote } from "./form-note";

export function SignInForm() {
  const [state, action, pending] = useActionState(requestMagicLink, IDLE);

  return (
    <form action={action} className="mt-6 max-w-sm">
      <label
        htmlFor="email"
        className="block text-sm font-extrabold text-ink-soft"
      >
        Your email
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
        {pending ? "Sending…" : "Email me a link"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
