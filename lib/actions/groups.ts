"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateJoinCode } from "@/lib/join-code";
import { createClient } from "@/lib/supabase/server";

import { failed, succeeded, type ActionState } from "./result";

/** Attempts before giving up on finding a free code. */
const CODE_ATTEMPTS = 8;

function validName(value: FormDataEntryValue | null): string | null {
  const name = String(value ?? "").trim();
  if (name.length < 1 || name.length > 80) return null;
  return name;
}

/**
 * Creating a group is one call: `create_group` writes the group and the
 * leader's own membership in a single transaction, so there is no window in
 * which a group exists with nobody leading it.
 *
 * The code is generated here rather than in SQL so that generation is a pure
 * function with its own tests, and a collision is simply a retry — at 887
 * million combinations against a handful of active groups, the second attempt
 * is already a formality.
 */
export async function createGroup(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = validName(formData.get("name"));
  if (!name) return failed("Give the group a name of 1 to 80 characters.");

  const supabase = await createClient();

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase.rpc("create_group", {
      p_name: name,
      p_join_code: generateJoinCode(),
    });

    if (!error) {
      const group = data as { id: string };
      revalidatePath("/groups");
      redirect(`/groups/${group.id}`);
    }

    // 23505 is a unique violation: the code is already taken by an active
    // group. Anything else is a real failure and should be reported.
    if (error.code !== "23505") {
      if (error.message.includes("display name")) {
        return failed("Set your display name before creating a group.");
      }
      if (error.message.includes("anonymous")) {
        return failed("Sign in with your email before creating a group.");
      }
      return failed("The group could not be created.");
    }
  }

  return failed("Could not find a free join code. Try again.");
}

export async function renameGroup(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("groupId") ?? "");
  const name = validName(formData.get("name"));
  if (!name) return failed("Give the group a name of 1 to 80 characters.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", id)
    .select("id");

  if (error) return failed("The group could not be renamed.");
  // No error and no row means row-level security refused it, which for this
  // form means the caller does not lead this group.
  if ((data ?? []).length === 0)
    return failed("Only the group's leader can rename it.");

  revalidatePath(`/groups/${id}`);
  revalidatePath("/groups");
  return succeeded("Renamed.");
}

/**
 * Archiving, never deleting. A group's meetings and what people wrote in them
 * outlive the group, and an archived group also releases its join code.
 */
export async function setGroupArchived(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("groupId") ?? "");
  const archived = formData.get("archived") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");

  if (error) {
    return failed(
      archived
        ? "The group could not be archived."
        : "That join code is taken by another active group. Rotate it first.",
    );
  }
  if ((data ?? []).length === 0)
    return failed("Only the group's leader can do that.");

  revalidatePath(`/groups/${id}`);
  revalidatePath("/groups");
  return succeeded(archived ? "Archived." : "Reopened.");
}

export async function rotateJoinCode(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("groupId") ?? "");
  const supabase = await createClient();

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("groups")
      .update({ join_code: generateJoinCode() })
      .eq("id", id)
      .select("id");

    if (!error) {
      if ((data ?? []).length === 0) {
        return failed("Only the group's leader can rotate the code.");
      }
      revalidatePath(`/groups/${id}`);
      return succeeded("New code. The old one no longer works.");
    }
    if (error.code !== "23505") return failed("The code could not be rotated.");
  }

  return failed("Could not find a free join code. Try again.");
}

export async function removeMember(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("profile_id", profileId);

  if (error) return failed("That person could not be removed.");

  revalidatePath(`/groups/${groupId}`);
  return succeeded("Removed.");
}
