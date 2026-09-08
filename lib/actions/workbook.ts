"use server";

import { revalidatePath } from "next/cache";

import { ruleOfPlay } from "@/content";
import { WORKBOOK_KINDS, type WorkbookKind } from "@/lib/db/workbook";
import { createClient } from "@/lib/supabase/server";

import { failed, succeeded, type ActionState } from "./result";

const MAX_BODY = 20_000;

function isKind(value: string): value is WorkbookKind {
  return (WORKBOOK_KINDS as readonly string[]).includes(value);
}

/**
 * One entry, saved.
 *
 * This runs as the participant, through their own session, so the row-level
 * security policy is what decides whether the write is theirs to make. Nothing
 * here checks ownership, and nothing here should start to: the moment this
 * function has an opinion about whose row it is, there are two answers to that
 * question and one of them will drift.
 */
export async function saveWorkbookEntry(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const sessionNumber = Number(formData.get("sessionNumber"));
  const kind = String(formData.get("kind") ?? "");
  const body = String(formData.get("body") ?? "");

  if (
    !Number.isInteger(sessionNumber) ||
    sessionNumber < 1 ||
    sessionNumber > 10
  ) {
    return failed("That is not a session in this curriculum.");
  }
  if (!isKind(kind)) return failed("That is not something the workbook holds.");
  if (body.length > MAX_BODY)
    return failed("That is longer than the workbook keeps.");

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return failed("You are not signed in on this device.");

  const { error } = await supabase.from("workbook_entries").upsert(
    {
      profile_id: session.user.id,
      group_id: groupId,
      session_number: sessionNumber,
      kind,
      body,
    },
    { onConflict: "profile_id,group_id,session_number,kind" },
  );

  if (error)
    return failed("That did not save. Your words are still on screen.");

  revalidatePath(`/me/${groupId}/session/${sessionNumber}`);
  return succeeded("Saved");
}

/** The headings the printed worksheet uses, and the only keys stored. */
const SECTION_HEADINGS = ruleOfPlay.lines.map((line) => line.heading);

export async function saveRuleOfPlay(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const oneSentence = String(formData.get("oneSentence") ?? "");
  if (oneSentence.length > 500) return failed("Keep that to a sentence.");

  const sections: Record<string, string> = {};
  for (const heading of SECTION_HEADINGS) {
    const value = String(formData.get(`section:${heading}`) ?? "");
    if (value.length > MAX_BODY)
      return failed("That is longer than the sheet holds.");
    if (value.trim() !== "") sections[heading] = value;
  }

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return failed("You are not signed in on this device.");

  const { error } = await supabase.from("rule_of_play").upsert(
    {
      profile_id: session.user.id,
      group_id: groupId,
      sections,
      one_sentence: oneSentence,
    },
    { onConflict: "profile_id,group_id" },
  );

  if (error)
    return failed("That did not save. Your words are still on screen.");

  revalidatePath(`/me/${groupId}/rule`);
  return succeeded("Saved");
}

/**
 * Sharing, which is the participant's decision and nobody else's. The policy
 * enforces that; this only carries the choice.
 */
export async function setRuleShared(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const shared = formData.get("shared") === "true";

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return failed("You are not signed in on this device.");

  const { error } = await supabase
    .from("rule_of_play")
    .upsert(
      { profile_id: session.user.id, group_id: groupId, shared },
      { onConflict: "profile_id,group_id" },
    );

  if (error) return failed("That could not be changed.");

  revalidatePath(`/me/${groupId}/rule`);
  revalidatePath(`/me/${groupId}/shared`);
  return succeeded(
    shared ? "Shared with your group." : "Private again. Only you can read it.",
  );
}
