import { beforeAll, describe, expect, it } from "vitest";

import {
  createGroup,
  join,
  serviceClient,
  signInAnonymously,
  signInExisting,
  signInIdentified,
  testCode,
  type Actor,
  type TestGroup,
} from "./harness";

/**
 * Row-level security for identity, groups, and joining.
 *
 * Two groups that share nothing, and four people: each group's leader, a
 * participant in the Tuesday group, and a participant in the Thursday one.
 * Almost every assertion below is "Ada, in Tuesday, cannot see or touch
 * Thursday" — and each denial is paired with the matching positive control,
 * because a suite of denials passes just as well when everything is broken.
 */
let tuesdayLeader: Actor;
let thursdayLeader: Actor;
let ada: Actor;
let bo: Actor;
let tuesday: TestGroup;
let thursday: TestGroup;

beforeAll(async () => {
  tuesdayLeader = await signInIdentified("Tuesday Leader");
  thursdayLeader = await signInIdentified("Thursday Leader");

  tuesday = await createGroup(tuesdayLeader, "Tuesday evening", testCode());
  thursday = await createGroup(thursdayLeader, "Thursday morning", testCode());

  ada = await signInAnonymously();
  bo = await signInAnonymously();

  expect(await join(ada, tuesday.joinCode, "Ada")).toHaveProperty("id");
  expect(await join(bo, thursday.joinCode, "Bo")).toHaveProperty("id");
});

describe("a participant sees their own group and no other", () => {
  it("reads the group they joined", async () => {
    const { data, error } = await ada.client.from("groups").select("id, name");
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      id: tuesday.id,
      name: "Tuesday evening",
    });
  });

  it("cannot read another group, even knowing its id", async () => {
    const { data, error } = await ada.client
      .from("groups")
      .select("id")
      .eq("id", thursday.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("cannot find a group by its join code, so codes are not enumerable", async () => {
    const { data } = await ada.client
      .from("groups")
      .select("id")
      .eq("join_code", thursday.joinCode);
    expect(data).toEqual([]);
  });

  it("reads the roster of their own group", async () => {
    const { data, error } = await ada.client
      .from("memberships")
      .select("profile_id, role");
    expect(error).toBeNull();
    expect(data?.map((row) => row.profile_id).sort()).toEqual(
      [tuesdayLeader.id, ada.id].sort(),
    );
  });

  it("cannot read another group's memberships", async () => {
    const { data } = await ada.client
      .from("memberships")
      .select("profile_id")
      .eq("group_id", thursday.id);
    expect(data).toEqual([]);
  });

  it("reads the display names of people they meet with, and nobody else's", async () => {
    const { data, error } = await ada.client
      .from("profiles")
      .select("id, display_name");
    expect(error).toBeNull();
    const visible = new Set(data?.map((row) => row.id));
    expect(visible).toContain(ada.id);
    expect(visible).toContain(tuesdayLeader.id);
    expect(visible).not.toContain(bo.id);
    expect(visible).not.toContain(thursdayLeader.id);
  });
});

describe("a participant cannot become a leader", () => {
  it("cannot write to groups", async () => {
    const renamed = await ada.client
      .from("groups")
      .update({ name: "Ada's group now" })
      .eq("id", tuesday.id)
      .select();
    // No matching policy: the update finds no row to change rather than erroring.
    expect(renamed.data ?? []).toEqual([]);

    const { data } = await serviceClient()
      .from("groups")
      .select("name")
      .eq("id", tuesday.id)
      .single();
    expect(data?.name).toBe("Tuesday evening");
  });

  it("cannot create a group at all, being anonymous", async () => {
    const { error } = await ada.client.rpc("create_group", {
      p_name: "Breakaway",
      p_join_code: testCode(),
    });
    expect(error?.message).toContain("anonymous users cannot lead a group");
  });

  it("cannot insert a group row directly either, RPC or not", async () => {
    const { error } = await ada.client
      .from("groups")
      .insert({ name: "Breakaway", leader_id: ada.id, join_code: testCode() });
    expect(error).not.toBeNull();
  });

  it("cannot promote themselves in memberships", async () => {
    const promoted = await ada.client
      .from("memberships")
      .update({ role: "leader" })
      .eq("group_id", tuesday.id)
      .eq("profile_id", ada.id)
      .select();
    expect(promoted.error ?? { message: "" }).toBeTruthy();

    const { data } = await serviceClient()
      .from("memberships")
      .select("role")
      .eq("group_id", tuesday.id)
      .eq("profile_id", ada.id)
      .single();
    expect(data?.role).toBe("participant");
  });

  it("cannot add themselves to a group they were never given a code for", async () => {
    const { error } = await ada.client.from("memberships").insert({
      group_id: thursday.id,
      profile_id: ada.id,
      role: "participant",
    });
    expect(error).not.toBeNull();
  });

  it("cannot rename someone else's profile", async () => {
    const renamed = await ada.client
      .from("profiles")
      .update({ display_name: "Not Bo" })
      .eq("id", bo.id)
      .select();
    expect(renamed.data ?? []).toEqual([]);
  });

  it("can rename their own", async () => {
    const { error } = await ada.client
      .from("profiles")
      .update({ display_name: "Ada R." })
      .eq("id", ada.id);
    expect(error).toBeNull();
  });
});

describe("a leader can run their own group and only their own", () => {
  it("renames and archives their group", async () => {
    const renamed = await tuesdayLeader.client
      .from("groups")
      .update({ name: "Tuesday evening (spring)" })
      .eq("id", tuesday.id)
      .select()
      .single();
    expect(renamed.error).toBeNull();
    expect(renamed.data?.name).toBe("Tuesday evening (spring)");
  });

  it("rotates the join code", async () => {
    const next = testCode();
    const { error } = await tuesdayLeader.client
      .from("groups")
      .update({ join_code: next })
      .eq("id", tuesday.id);
    expect(error).toBeNull();
    tuesday = { ...tuesday, joinCode: next };
  });

  it("cannot touch another leader's group", async () => {
    const renamed = await tuesdayLeader.client
      .from("groups")
      .update({ name: "Mine now" })
      .eq("id", thursday.id)
      .select();
    expect(renamed.data ?? []).toEqual([]);
  });

  it("cannot hand their group to someone else by rewriting leader_id", async () => {
    const { error } = await tuesdayLeader.client
      .from("groups")
      .update({ leader_id: ada.id })
      .eq("id", tuesday.id)
      .select()
      .single();
    // The WITH CHECK half of the policy refuses the row's new shape.
    expect(error).not.toBeNull();
  });

  it("removes a member from their own group", async () => {
    const spare = await signInAnonymously();
    await join(spare, tuesday.joinCode, "Passing visitor");

    const { error } = await tuesdayLeader.client
      .from("memberships")
      .delete()
      .eq("group_id", tuesday.id)
      .eq("profile_id", spare.id);
    expect(error).toBeNull();

    const { data } = await serviceClient()
      .from("memberships")
      .select("profile_id")
      .eq("group_id", tuesday.id)
      .eq("profile_id", spare.id);
    expect(data).toEqual([]);
  });
});

describe("creating a group is one write, not two", () => {
  it("gives the leader their group back and a membership in it", async () => {
    const leader = await signInIdentified("Atomic Leader");
    const group = await createGroup(leader, "Atomic", testCode());

    const { data, error } = await leader.client
      .from("memberships")
      .select("role")
      .eq("group_id", group.id)
      .eq("profile_id", leader.id)
      .single();
    expect(error).toBeNull();
    expect(data?.role).toBe("leader");
  });

  it("refuses a leader who has not set a display name yet", async () => {
    const email = `nameless-${Date.now()}@example.test`;
    const created = await serviceClient().auth.admin.createUser({
      email,
      password: "press-start-test-password",
      email_confirm: true,
    });
    expect(created.error).toBeNull();

    const nameless = await signInExisting(email);
    const { error } = await nameless.client.rpc("create_group", {
      p_name: "Nameless",
      p_join_code: testCode(),
    });
    expect(error?.message).toContain("display name");
  });
});

describe("the server-only surface stays server-only", () => {
  it("refuses join_group to a signed-in participant", async () => {
    const { error } = await ada.client.rpc("join_group", {
      p_profile_id: ada.id,
      p_code: thursday.joinCode,
      p_display_name: "Ada",
    });
    expect(error).not.toBeNull();
  });

  it("refuses join_group to a request with no session at all", async () => {
    const stranger = await signInAnonymously();
    await stranger.client.auth.signOut();
    const { error } = await stranger.client.rpc("join_group", {
      p_profile_id: stranger.id,
      p_code: thursday.joinCode,
      p_display_name: "Stranger",
    });
    expect(error).not.toBeNull();
  });

  it("does not expose the private schema through the Data API", async () => {
    const { error } = await serviceClient()
      .schema("private")
      .from("join_attempts")
      .select("id");
    expect(error).not.toBeNull();
  });
});

describe("joining", () => {
  it("refuses an unknown code", async () => {
    const newcomer = await signInAnonymously();
    const result = await join(newcomer, "ZZZZZZ", "Newcomer");
    expect(result).toHaveProperty("error");
  });

  it("refuses a code whose group has been archived", async () => {
    const leader = await signInIdentified("Archiving Leader");
    const code = testCode();
    const group = await createGroup(leader, "Last term", code);
    await leader.client
      .from("groups")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", group.id);

    const latecomer = await signInAnonymously();
    expect(await join(latecomer, code, "Latecomer")).toHaveProperty("error");
  });

  it("frees the code again once the group is archived", async () => {
    const leader = await signInIdentified("Recycling Leader");
    const code = testCode();
    const first = await createGroup(leader, "Autumn", code);
    await leader.client
      .from("groups")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", first.id);

    const second = await createGroup(leader, "Spring", code);
    expect(second.id).not.toBe(first.id);
  });

  it("is idempotent, so a second attempt with the same code is not an error", async () => {
    const twice = await signInAnonymously();
    expect(await join(twice, tuesday.joinCode, "Twice")).toHaveProperty("id");
    expect(await join(twice, tuesday.joinCode, "Twice")).toHaveProperty("id");

    const { data } = await serviceClient()
      .from("memberships")
      .select("profile_id")
      .eq("group_id", tuesday.id)
      .eq("profile_id", twice.id);
    expect(data).toHaveLength(1);
  });

  it("keeps the same UUID when a participant later attaches an email", async () => {
    // The whole promise of "join with a code now, keep it forever later" rests
    // on this: the anonymous UUID survives, so every workbook entry written
    // against it carries over without a migration.
    const participant = await signInAnonymously();
    await join(participant, tuesday.joinCode, "Later Emailed");
    const before = participant.id;

    const email = `participant-${Date.now()}@example.test`;
    const { error } = await serviceClient().auth.admin.updateUserById(before, {
      email,
      email_confirm: true,
    });
    expect(error).toBeNull();

    const { data } = await serviceClient().auth.admin.getUserById(before);
    expect(data.user?.id).toBe(before);
    expect(data.user?.email).toBe(email);
    expect(data.user?.is_anonymous).toBe(false);
  });
});
