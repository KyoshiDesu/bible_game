"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IDLE } from "@/lib/actions/result";
import { saveWorkbookEntry } from "@/lib/actions/workbook";

/** How long after the last keystroke to save. */
const QUIET_MS = 900;

type Status = "idle" | "saving" | "saved" | "error";

const STATUS_TEXT: Record<Status, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Not saved — your words are still here. Trying again when you type.",
};

interface AutosaveFieldProps {
  groupId: string;
  sessionNumber: number;
  kind: "reflection" | "challenge" | "practice";
  label: string;
  prompt?: string;
  initial: string;
}

/**
 * A workbook box that saves itself.
 *
 * Someone writing in this is on a phone, in a room, and will close it without
 * thinking. So it saves on a pause rather than on a button, flushes on blur,
 * and says which of those it has done — silence would leave them guessing
 * whether the thing they just admitted is anywhere.
 */
export function AutosaveField({
  groupId,
  sessionNumber,
  kind,
  label,
  prompt,
  initial,
}: AutosaveFieldProps) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // What the server is known to hold, so a blur after a completed save is not
  // a second write of the same words.
  const saved = useRef(initial);

  const save = useCallback(
    async (body: string) => {
      if (body === saved.current) return;
      setStatus("saving");

      const formData = new FormData();
      formData.set("groupId", groupId);
      formData.set("sessionNumber", String(sessionNumber));
      formData.set("kind", kind);
      formData.set("body", body);

      const result = await saveWorkbookEntry(IDLE, formData);
      if (result.error) {
        setStatus("error");
        return;
      }
      saved.current = body;
      setStatus("saved");
    },
    [groupId, sessionNumber, kind],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  function onChange(next: string) {
    setValue(next);
    setStatus("idle");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(next), QUIET_MS);
  }

  function onBlur() {
    clearTimeout(timer.current);
    void save(value);
  }

  const fieldId = `${kind}-${sessionNumber}`;

  return (
    <section className="mt-4 rounded-xl border border-rule bg-surface px-5 py-4">
      <label
        htmlFor={fieldId}
        className="block text-sm font-extrabold text-ink-soft"
      >
        {label}
      </label>
      {prompt ? (
        <p className="mt-1 mb-0 text-sm text-ink-soft">{prompt}</p>
      ) : null}
      <textarea
        id={fieldId}
        name="body"
        rows={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-2 w-full rounded-lg border border-rule bg-page px-3 py-2 text-base text-ink"
      />
      <p
        role="status"
        aria-live="polite"
        className={`mt-1 min-h-5 text-xs ${
          status === "error" ? "text-clay" : "text-ink-faint-legible"
        }`}
      >
        {STATUS_TEXT[status]}
      </p>
    </section>
  );
}
