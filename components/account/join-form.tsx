"use client";

import { useActionState, useState } from "react";

import { joinGroup } from "@/lib/actions/join";
import { IDLE } from "@/lib/actions/result";
import { JOIN_CODE_LENGTH } from "@/lib/join-code";

import { BUTTON, FIELD, FormNote } from "./form-note";

export function JoinForm() {
  const [state, action, pending] = useActionState(joinGroup, IDLE);
  // Controlled, because React resets an uncontrolled form after an action
  // runs — and someone who has just mistyped six characters should not also
  // have to retype their name.
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");

  return (
    <form action={action} className="mt-6">
      <label
        htmlFor="code"
        className="block text-sm font-extrabold text-ink-soft"
      >
        Join code
      </label>
      <input
        id="code"
        name="code"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        required
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        maxLength={JOIN_CODE_LENGTH + 2}
        placeholder="ABC234"
        aria-describedby="code-help"
        className={`${FIELD} mt-1.5 text-center font-mono text-2xl tracking-[0.3em] uppercase`}
      />
      <p id="code-help" className="mt-1.5 text-sm text-ink-faint-legible">
        Six characters, from the screen at the front.
      </p>

      <label
        htmlFor="displayName"
        className="mt-5 block text-sm font-extrabold text-ink-soft"
      >
        Your name
      </label>
      <input
        id="displayName"
        name="displayName"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        required
        autoComplete="nickname"
        maxLength={60}
        aria-describedby="name-help"
        className={`${FIELD} mt-1.5`}
      />
      <p id="name-help" className="mt-1.5 text-sm text-ink-faint-legible">
        What the group sees. It does not have to be your full name.
      </p>

      <button
        type="submit"
        className={`${BUTTON} mt-5 w-full py-3 text-base`}
        disabled={pending}
      >
        {pending ? "Joining…" : "Join"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
