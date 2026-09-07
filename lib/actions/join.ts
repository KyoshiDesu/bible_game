"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isJoinCode, normalizeJoinCode } from "@/lib/join-code";
import {
  joinAttemptsExhausted,
  recordFailedJoin,
  requesterIp,
  FAILED_JOINS_PER_MINUTE,
} from "@/lib/rate-limit";
import { siteUrl } from "@/lib/supabase/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { failed, succeeded, type ActionState } from "./result";

const WRONG_CODE =
  "That code doesn't match an open group. Check it and try again.";

/**
 * Joining: a code and a name, no email and no password.
 *
 * The order of operations matters. The code is checked with the server's own
 * client first, because `groups` is unreadable to anyone who is not already a
 * member — which is what keeps codes from being enumerable — and only then is
 * an anonymous user issued. Signing in first would mint a throwaway account on
 * every typo, and Supabase caps anonymous sign-ups per address: a room full of
 * people mistyping the code would exhaust the church's allowance between them.
 */
export async function joinGroup(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = normalizeJoinCode(String(formData.get("code") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 1 || displayName.length > 60) {
    return failed("Give the name you would like the group to see.");
  }

  const ip = await requesterIp();
  if (await joinAttemptsExhausted(ip)) {
    return failed(
      `That is ${FAILED_JOINS_PER_MINUTE} wrong codes in a minute. Wait a moment, then try again.`,
    );
  }

  if (!isJoinCode(code)) {
    await recordFailedJoin(ip);
    return failed(WRONG_CODE);
  }

  const admin = createAdminClient();
  const { data: group, error: lookupError } = await admin
    .from("groups")
    .select("id")
    .eq("join_code", code)
    .is("archived_at", null)
    .maybeSingle();

  if (lookupError)
    return failed("Something went wrong. Try again in a moment.");
  if (!group) {
    await recordFailedJoin(ip);
    return failed(WRONG_CODE);
  }

  const supabase = await createClient();
  const existing = await supabase.auth.getUser();
  let profileId = existing.data.user?.id;

  if (!profileId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return failed("Could not start a session on this device. Try again.");
    }
    profileId = data.user.id;
  }

  const { error } = await admin.rpc("join_group", {
    p_profile_id: profileId,
    p_code: code,
    p_display_name: displayName,
  });

  if (error) {
    await recordFailedJoin(ip);
    return failed(WRONG_CODE);
  }

  revalidatePath("/me");
  redirect("/me");
}

/**
 * A participant attaching an email to the anonymous account they already have.
 *
 * The UUID does not change, which is the whole point: everything written
 * against it stays theirs. Supabase sends a confirmation to the new address,
 * and the account stays anonymous until that link is followed.
 */
export async function attachEmail(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failed("That does not look like an email address.");
  }

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return failed("You are not signed in on this device.");

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${siteUrl()}/auth/confirm` },
  );

  if (error) {
    if (error.status === 429) {
      return failed("Too many emails requested. Wait a minute and try again.");
    }
    return failed("That address could not be attached.");
  }

  return succeeded("Check that inbox and follow the link to confirm it.");
}
