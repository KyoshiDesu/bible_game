"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { siteUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { failed, succeeded, type ActionState } from "./result";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A leader signs in by magic link. There is no password anywhere in this
 * application: a leader signs in a handful of times a semester, and a password
 * they would have to reset every time is worse than a link.
 */
export async function requestMagicLink(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!EMAIL.test(email)) {
    return failed("That does not look like an email address.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm` },
  });

  // The same message either way: whether an address has an account here is not
  // something an unauthenticated form should reveal.
  if (error && error.status !== 429) {
    return succeeded("Check your email for a link to sign in.");
  }
  if (error) {
    return failed("Too many links requested. Wait a minute and try again.");
  }

  return succeeded("Check your email for a link to sign in.");
}

export async function setDisplayName(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 1 || displayName.length > 60) {
    return failed("Give a name between 1 and 60 characters.");
  }

  const supabase = await createClient();
  const { data, error: sessionError } = await supabase.auth.getUser();
  if (sessionError || !data.user) return failed("You are not signed in.");

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, display_name: displayName });
  if (error) return failed("That name could not be saved.");

  revalidatePath("/groups");
  return succeeded();
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
