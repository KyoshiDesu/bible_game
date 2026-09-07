"use client";

import { useActionState } from "react";

import {
  removeMember,
  renameGroup,
  rotateJoinCode,
  setGroupArchived,
} from "@/lib/actions/groups";
import { IDLE } from "@/lib/actions/result";

import { BUTTON, FIELD, FormNote, QUIET_BUTTON } from "./form-note";

export function RenameGroupForm({
  groupId,
  name,
}: {
  groupId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(renameGroup, IDLE);

  return (
    <form action={action} className="max-w-sm">
      <input type="hidden" name="groupId" value={groupId} />
      <label
        htmlFor="name"
        className="block text-sm font-extrabold text-ink-soft"
      >
        Group name
      </label>
      <input
        id="name"
        name="name"
        defaultValue={name}
        maxLength={80}
        required
        className={`${FIELD} mt-1.5`}
      />
      <button type="submit" className={`${BUTTON} mt-3`} disabled={pending}>
        {pending ? "Saving…" : "Rename"}
      </button>
      <FormNote state={state} />
    </form>
  );
}

export function RotateCodeForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(rotateJoinCode, IDLE);

  return (
    <form action={action}>
      <input type="hidden" name="groupId" value={groupId} />
      <button type="submit" className={QUIET_BUTTON} disabled={pending}>
        {pending ? "Rotating…" : "Rotate code"}
      </button>
      <FormNote state={state} />
    </form>
  );
}

export function ArchiveGroupForm({
  groupId,
  archived,
}: {
  groupId: string;
  archived: boolean;
}) {
  const [state, action, pending] = useActionState(setGroupArchived, IDLE);

  return (
    <form action={action}>
      <input type="hidden" name="groupId" value={groupId} />
      <input
        type="hidden"
        name="archived"
        value={archived ? "false" : "true"}
      />
      <button type="submit" className={QUIET_BUTTON} disabled={pending}>
        {archived ? "Reopen group" : "Archive group"}
      </button>
      <FormNote state={state} />
    </form>
  );
}

export function RemoveMemberForm({
  groupId,
  profileId,
  displayName,
}: {
  groupId: string;
  profileId: string;
  displayName: string;
}) {
  const [state, action, pending] = useActionState(removeMember, IDLE);

  return (
    <form action={action}>
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="profileId" value={profileId} />
      <button
        type="submit"
        className="text-sm font-semibold text-clay underline underline-offset-2 disabled:opacity-60"
        disabled={pending}
      >
        <span className="sr-only">Remove {displayName} from the group</span>
        <span aria-hidden>Remove</span>
      </button>
      <FormNote state={state} />
    </form>
  );
}
