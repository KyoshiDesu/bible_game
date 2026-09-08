import { beforeAll, describe, expect, it } from "vitest";

import {
  createGroup,
  join,
  serviceClient,
  signInAnonymously,
  signInIdentified,
  testCode,
  type Actor,
  type TestGroup,
} from "./harness";

/**
 * The two pastoral policies, held to.
 *
 * The design records them as decisions rather than mechanisms, and says they
 * must not be quietly reversed later. This file is what "not quietly" means: a
 * participant reads only their own entries, and a leader cannot read a body at
 * all — not directly, not through the roster, not through the engagement view,
 * and not with a filter that names the row.
 *
 * Every denial has its positive control beside it. A suite that only proves
 * nobody can read anything passes just as well when the whole table is broken.
 */
let leader: Actor;
let otherLeader: Actor;
let ada: Actor;
let bo: Actor;
let outsider: Actor;
let group: TestGroup;
let otherGroup: TestGroup;

const ADA_REFLECTION = "I counted the hours and the number frightened me.";
const BO_REFLECTION = "Four hundred dollars, and I could not say on what.";

beforeAll(async () => {
  leader = await signInIdentified("Workbook Leader");
  otherLeader = await signInIdentified("Other Leader");
  group = await createGroup(leader, "Workbook group", testCode());
  otherGroup = await createGroup(otherLeader, "Somewhere else", testCode());

  ada = await signInAnonymously();
  bo = await signInAnonymously();
  outsider = await signInAnonymously();
  expect(await join(ada, group.joinCode, "Ada")).toHaveProperty("id");
  expect(await join(bo, group.joinCode, "Bo")).toHaveProperty("id");
  expect(await join(outsider, otherGroup.joinCode, "Outsider")).toHaveProperty(
    "id",
  );

  for (const [actor, body] of [
    [ada, ADA_REFLECTION],
    [bo, BO_REFLECTION],
  ] as const) {
    const { error } = await actor.client.from("workbook_entries").upsert({
      profile_id: actor.id,
      group_id: group.id,
      session_number: 5,
      kind: "reflection",
      body,
    });
    expect(error).toBeNull();
  }
});

describe("a participant's workbook is their own", () => {
  it("reads back what they wrote", async () => {
    const { data, error } = await ada.client
      .from("workbook_entries")
      .select("session_number, kind, body");
    expect(error).toBeNull();
    expect(data).toEqual([
      { session_number: 5, kind: "reflection", body: ADA_REFLECTION },
    ]);
  });

  it("cannot read another participant's entry in the same group", async () => {
    const { data } = await ada.client
      .from("workbook_entries")
      .select("body")
      .eq("profile_id", bo.id);
    expect(data).toEqual([]);
  });

  it("cannot write an entry under someone else's name", async () => {
    const { error } = await ada.client.from("workbook_entries").insert({
      profile_id: bo.id,
      group_id: group.id,
      session_number: 6,
      kind: "practice",
      body: "not mine to write",
    });
    expect(error).not.toBeNull();
  });

  it("cannot write into a group they are not in", async () => {
    const { error } = await ada.client.from("workbook_entries").insert({
      profile_id: ada.id,
      group_id: otherGroup.id,
      session_number: 1,
      kind: "reflection",
      body: "wrong room",
    });
    expect(error).not.toBeNull();
  });

  it("cannot edit another participant's entry", async () => {
    const { data } = await ada.client
      .from("workbook_entries")
      .update({ body: "overwritten" })
      .eq("profile_id", bo.id)
      .select();
    expect(data ?? []).toEqual([]);

    const { data: intact } = await serviceClient()
      .from("workbook_entries")
      .select("body")
      .eq("profile_id", bo.id)
      .single();
    expect(intact?.body).toBe(BO_REFLECTION);
  });
});

describe("the leader cannot read what anyone wrote", () => {
  it("gets nothing from the table", async () => {
    const { data, error } = await leader.client
      .from("workbook_entries")
      .select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("gets nothing when naming the row exactly", async () => {
    const { data } = await leader.client
      .from("workbook_entries")
      .select("body")
      .eq("profile_id", ada.id)
      .eq("group_id", group.id)
      .eq("session_number", 5)
      .eq("kind", "reflection");
    expect(data).toEqual([]);
  });

  it("cannot reach a body by joining from the roster", async () => {
    const { data, error } = await leader.client
      .from("memberships")
      .select("profile_id, workbook_entries ( body )")
      .eq("group_id", group.id);
    // Either the embed is refused outright or it comes back empty. What must
    // never happen is a body arriving in it.
    const bodies = JSON.stringify(data ?? []);
    expect(bodies).not.toContain(ADA_REFLECTION);
    expect(bodies).not.toContain(BO_REFLECTION);
    if (error) expect(error).not.toBeNull();
  });

  it("cannot write into a participant's workbook either", async () => {
    const { error } = await leader.client.from("workbook_entries").insert({
      profile_id: ada.id,
      group_id: group.id,
      session_number: 7,
      kind: "challenge",
      body: "assigned by the leader",
    });
    expect(error).not.toBeNull();
  });
});

describe("engagement shows that, never what", () => {
  it("tells the leader who has written", async () => {
    const { data, error } = await leader.client.rpc("group_engagement", {
      p_group_id: group.id,
    });
    expect(error).toBeNull();

    const rows = data as {
      profile_id: string;
      display_name: string;
      sessions_written: Record<string, number>;
    }[];
    const forAda = rows.find((row) => row.profile_id === ada.id);
    expect(forAda?.display_name).toBe("Ada");
    expect(forAda?.sessions_written).toEqual({ "5": 1 });

    const forLeader = rows.find((row) => row.profile_id === leader.id);
    expect(forLeader?.sessions_written).toEqual({});
  });

  it("returns counts and names and nothing else", async () => {
    const { data } = await leader.client.rpc("group_engagement", {
      p_group_id: group.id,
    });
    const serialised = JSON.stringify(data);
    expect(serialised).not.toContain(ADA_REFLECTION);
    expect(serialised).not.toContain(BO_REFLECTION);

    const columns = Object.keys((data as Record<string, unknown>[])[0] ?? {});
    expect(columns.sort()).toEqual([
      "display_name",
      "profile_id",
      "role",
      "rule_of_play_shared",
      "rule_of_play_written",
      "sessions_written",
    ]);
  });

  it("is refused to a participant", async () => {
    const { error } = await ada.client.rpc("group_engagement", {
      p_group_id: group.id,
    });
    expect(error?.message).toContain("only the leader");
  });

  it("is refused to another group's leader", async () => {
    const { error } = await otherLeader.client.rpc("group_engagement", {
      p_group_id: group.id,
    });
    expect(error?.message).toContain("only the leader");
  });
});

describe("a rule of play is private until its author says otherwise", () => {
  beforeAll(async () => {
    const { error } = await ada.client.from("rule_of_play").upsert({
      profile_id: ada.id,
      group_id: group.id,
      sections: { "What I play": "Nothing after 10:30 on a work night." },
      one_sentence: "That he plays like someone with somewhere to be.",
      shared: false,
    });
    expect(error).toBeNull();
  });

  it("is invisible to the rest of the group while private", async () => {
    expect(
      (await bo.client.from("rule_of_play").select("one_sentence")).data,
    ).toEqual([]);
    expect(
      (await leader.client.from("rule_of_play").select("one_sentence")).data,
    ).toEqual([]);
  });

  it("its author can still read it", async () => {
    const { data } = await ada.client
      .from("rule_of_play")
      .select("one_sentence");
    expect(data).toHaveLength(1);
  });

  it("becomes readable by the group when its author shares it", async () => {
    const { error } = await ada.client
      .from("rule_of_play")
      .update({ shared: true })
      .eq("profile_id", ada.id)
      .eq("group_id", group.id);
    expect(error).toBeNull();

    const { data } = await bo.client
      .from("rule_of_play")
      .select("one_sentence");
    expect(data).toHaveLength(1);
    expect(data?.[0]?.one_sentence).toContain("somewhere to be");
  });

  it("is still invisible outside the group once shared", async () => {
    const { data } = await outsider.client
      .from("rule_of_play")
      .select("one_sentence");
    expect(data).toEqual([]);
  });

  it("cannot be shared on someone else's behalf", async () => {
    await bo.client.from("rule_of_play").upsert({
      profile_id: bo.id,
      group_id: group.id,
      one_sentence: "Bo's own, kept back.",
      shared: false,
    });

    const { data } = await ada.client
      .from("rule_of_play")
      .update({ shared: true })
      .eq("profile_id", bo.id)
      .select();
    expect(data ?? []).toEqual([]);

    const { data: intact } = await serviceClient()
      .from("rule_of_play")
      .select("shared")
      .eq("profile_id", bo.id)
      .single();
    expect(intact?.shared).toBe(false);
  });

  it("tells the leader it exists without showing it", async () => {
    const { data } = await leader.client.rpc("group_engagement", {
      p_group_id: group.id,
    });
    const rows = data as {
      profile_id: string;
      rule_of_play_written: boolean;
      rule_of_play_shared: boolean;
    }[];
    expect(rows.find((row) => row.profile_id === bo.id)).toMatchObject({
      rule_of_play_written: true,
      rule_of_play_shared: false,
    });
    expect(JSON.stringify(rows)).not.toContain("kept back");
  });
});
