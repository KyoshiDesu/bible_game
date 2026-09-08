"use client";

import { useActionState } from "react";

import {
  BUTTON,
  FIELD,
  FormNote,
  QUIET_BUTTON,
} from "@/components/account/form-note";
import { IDLE } from "@/lib/actions/result";
import { saveRuleOfPlay, setRuleShared } from "@/lib/actions/workbook";
import { type RuleOfPlayEntry } from "@/lib/db/workbook";

interface RuleEditorProps {
  groupId: string;
  lines: readonly { heading: string; hint: string }[];
  closingLine: string;
  rule: RuleOfPlayEntry | null;
}

export function RuleEditor({
  groupId,
  lines,
  closingLine,
  rule,
}: RuleEditorProps) {
  const [state, action, pending] = useActionState(saveRuleOfPlay, IDLE);

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="groupId" value={groupId} />

      {lines.map((line) => (
        <div key={line.heading} className="mt-5">
          <label
            htmlFor={`section-${line.heading}`}
            className="block text-sm font-extrabold text-ink-soft"
          >
            {line.heading}
          </label>
          <p
            className="mt-1 mb-1 text-sm text-ink-faint-legible"
            dangerouslySetInnerHTML={{ __html: line.hint }}
          />
          <textarea
            id={`section-${line.heading}`}
            name={`section:${line.heading}`}
            rows={2}
            defaultValue={rule?.sections[line.heading] ?? ""}
            className={FIELD}
          />
        </div>
      ))}

      <div className="mt-6">
        <label
          htmlFor="oneSentence"
          className="block text-sm font-extrabold text-ink-soft"
        >
          {closingLine}
        </label>
        <textarea
          id="oneSentence"
          name="oneSentence"
          rows={2}
          maxLength={500}
          defaultValue={rule?.oneSentence ?? ""}
          className={`${FIELD} mt-1.5`}
        />
      </div>

      <button type="submit" className={`${BUTTON} mt-5`} disabled={pending}>
        {pending ? "Saving…" : "Save my rule"}
      </button>
      <FormNote state={state} />
    </form>
  );
}

export function ShareToggle({
  groupId,
  shared,
}: {
  groupId: string;
  shared: boolean;
}) {
  const [state, action, pending] = useActionState(setRuleShared, IDLE);

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="shared" value={shared ? "false" : "true"} />
      <button type="submit" className={QUIET_BUTTON} disabled={pending}>
        {shared ? "Make it private again" : "Share it with my group"}
      </button>
      <FormNote state={state} />
    </form>
  );
}
