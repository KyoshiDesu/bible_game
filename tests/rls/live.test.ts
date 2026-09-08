import { beforeAll, describe, expect, it } from "vitest";

import { session01Scenario } from "@/content/scenarios/session-01";

import { Client } from "pg";

import {
  createGroup,
  databaseUrl,
  join,
  serviceClient,
  signInAnonymously,
  signInIdentified,
  testCode,
  type Actor,
  type TestGroup,
} from "./harness";

/**
 * The live session's wire, against a real database.
 *
 * Two claims are worth a test here, and neither can be made from the front end.
 *
 * The first is that counts are broadcast *by the server*. A count is written by
 * a trigger and `realtime.messages` has no insert policy, so no client can put
 * a number on the projector — which is a property of the database, not a
 * convention in a component, and this is where it is checked.
 *
 * The second is that listening to a room is membership, not knowledge of a URL.
 * Realtime authorises a private channel by running a select against
 * `realtime.messages` with the caller's role, claims, and topic set, so that is
 * exactly what these tests do.
 */
const scenario = session01Scenario;
const BEAT_ZERO = scenario.beats[0]!;
const KEYS = BEAT_ZERO.choices.map((choice) => choice.key);

let leader: Actor;
let group: TestGroup;
let ada: Actor;
let bo: Actor;
let outsider: Actor;

beforeAll(async () => {
  leader = await signInIdentified("Live Leader");
  group = await createGroup(leader, "Live group", testCode());
  ada = await signInAnonymously();
  await join(ada, group.joinCode, "Ada");
  bo = await signInAnonymously();
  await join(bo, group.joinCode, "Bo");

  outsider = await signInIdentified("Somebody Else");
  await createGroup(outsider, "Another group", testCode());
});

async function startRun(actor: Actor = leader): Promise<string> {
  const { data, error } = await actor.client.rpc("start_meeting", {
    p_group_id: group.id,
    p_session_number: scenario.sessionNumber,
    p_scenario_id: scenario.id,
  });
  if (error) throw error;
  return (data as { id: string }).id;
}

async function runRow(runId: string) {
  const { data, error } = await serviceClient()
    .from("scenario_runs")
    .select("state, current_beat, tie, meeting_id")
    .eq("id", runId)
    .single();
  if (error) throw error;
  return data as {
    state: string;
    current_beat: number;
    tie: { tied: string[]; tally: Record<string, number> } | null;
    meeting_id: string;
  };
}

/**
 * Realtime's own authorization check, run by hand.
 *
 * Role, claims and topic set exactly as the server sets them when a client
 * joins a private channel, then a select against `realtime.messages`. Anything
 * this returns is what that client would be allowed to hear.
 */
async function asListener<T>(
  actor: Actor,
  topic: string,
  query: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('role', 'authenticated', true)");
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: actor.id, role: "authenticated" }),
    ]);
    await client.query("select set_config('realtime.topic', $1, true)", [
      topic,
    ]);
    return await query(client);
  } finally {
    await client.query("rollback").catch(() => undefined);
    await client.end();
  }
}

async function heardBy(actor: Actor, runId: string): Promise<number> {
  const topic = `room:${runId}`;
  return asListener(actor, topic, async (client) => {
    const { rows } = await client.query<{ n: string }>(
      "select count(*) as n from realtime.messages where topic = $1",
      [topic],
    );
    return Number(rows[0]?.n ?? 0);
  });
}

describe("starting and ending a meeting", () => {
  it("writes the meeting and its first run together", async () => {
    const runId = await startRun();
    const run = await runRow(runId);

    expect(run.state).toBe("idle");
    expect(run.current_beat).toBe(0);

    const { data } = await serviceClient()
      .from("meetings")
      .select("status, group_id, session_number")
      .eq("id", run.meeting_id)
      .single();
    expect(data).toMatchObject({
      status: "live",
      group_id: group.id,
      session_number: scenario.sessionNumber,
    });
  });

  it("leaves one live meeting when a leader starts a second", async () => {
    await startRun();
    await startRun();

    const { data, error } = await serviceClient()
      .from("meetings")
      .select("id")
      .eq("group_id", group.id)
      .eq("status", "live");
    if (error) throw error;
    expect(data).toHaveLength(1);
  });

  it("refuses a participant", async () => {
    const { error } = await ada.client.rpc("start_meeting", {
      p_group_id: group.id,
      p_session_number: scenario.sessionNumber,
      p_scenario_id: scenario.id,
    });
    expect(error?.message).toMatch(/only the leader/i);
  });

  it("refuses a leader of some other group", async () => {
    const { error } = await outsider.client.rpc("start_meeting", {
      p_group_id: group.id,
      p_session_number: scenario.sessionNumber,
      p_scenario_id: scenario.id,
    });
    expect(error?.message).toMatch(/only the leader/i);
  });

  it("refuses a session this curriculum does not have", async () => {
    const { error } = await leader.client.rpc("start_meeting", {
      p_group_id: group.id,
      p_session_number: 11,
      p_scenario_id: scenario.id,
    });
    expect(error).not.toBeNull();
  });

  it("lets only the leader end it", async () => {
    const runId = await startRun();
    const { meeting_id: meetingId } = await runRow(runId);

    const refused = await ada.client.rpc("end_meeting", {
      p_meeting_id: meetingId,
    });
    expect(refused.error?.message).toMatch(/only the leader/i);

    const allowed = await leader.client.rpc("end_meeting", {
      p_meeting_id: meetingId,
    });
    expect(allowed.error).toBeNull();

    const { data } = await serviceClient()
      .from("meetings")
      .select("status, ended_at")
      .eq("id", meetingId)
      .single();
    expect(data?.status).toBe("ended");
    expect(data?.ended_at).not.toBeNull();
  });
});

describe("the counts on the wire", () => {
  it("announces how many have voted, and nothing else", async () => {
    const runId = await startRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await ada.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[0],
    });

    const direct = new Client({ connectionString: databaseUrl });
    await direct.connect();
    try {
      const result = await direct.query<{
        event: string;
        private: boolean;
        payload: Record<string, unknown>;
      }>(
        "select event, private, payload from realtime.messages where topic = $1 order by inserted_at",
        [`room:${runId}`],
      );
      expect(result.rows).toHaveLength(1);
      const message = result.rows[0]!;
      expect(message.event).toBe("count");
      expect(message.private).toBe(true);
      expect(message.payload).toMatchObject({
        beatIndex: 0,
        voted: 1,
        members: 3,
      });
      // The exact field list, so a payload that grows a column fails here
      // rather than in front of a room. `id` is realtime.send's own message
      // identifier, not anything about a person.
      expect(Object.keys(message.payload).sort()).toEqual([
        "beatIndex",
        "id",
        "members",
        "voted",
      ]);

      // The privacy line, at the transport: an aggregate is the whole payload.
      // Nothing here names a person or a choice.
      const body = JSON.stringify(message.payload);
      expect(body).not.toContain(ada.id);
      expect(body).not.toContain(`"${KEYS[0]}"`);
    } finally {
      await direct.end();
    }
  });

  it("counts a changed vote once", async () => {
    const runId = await startRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await ada.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[0],
    });
    await ada.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[1],
    });

    const direct = new Client({ connectionString: databaseUrl });
    await direct.connect();
    try {
      const { rows } = await direct.query<{ payload: { voted: number } }>(
        "select payload from realtime.messages where topic = $1 order by inserted_at",
        [`room:${runId}`],
      );
      expect(rows.map((row) => row.payload.voted)).toEqual([1, 1]);
    } finally {
      await direct.end();
    }
  });
});

describe("who may listen to a room", () => {
  let runId: string;

  beforeAll(async () => {
    runId = await startRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await ada.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[0],
    });
  });

  it("lets a participant in the group hear the count", async () => {
    expect(await heardBy(ada, runId)).toBeGreaterThan(0);
  });

  it("lets the leader hear it", async () => {
    expect(await heardBy(leader, runId)).toBeGreaterThan(0);
  });

  it("tells someone outside the group nothing", async () => {
    expect(await heardBy(outsider, runId)).toBe(0);
  });

  it("tells a made-up topic nothing", async () => {
    const topic = "room:not-a-uuid";
    const heard = await asListener(ada, topic, async (client) => {
      const { rows } = await client.query<{ n: string }>(
        "select count(*) as n from realtime.messages",
      );
      return Number(rows[0]?.n ?? 0);
    });
    expect(heard).toBe(0);
  });

  it("lets nobody put a number on the projector", async () => {
    // The counts topic has a read policy and no write policy at all, so this
    // is refused for a member of the group as much as for anyone else. It is
    // what makes "the server broadcasts the counts" true rather than polite.
    await expect(
      asListener(ada, `room:${runId}`, (client) =>
        client.query(
          `insert into realtime.messages (topic, extension, payload, event, private, inserted_at)
           values ($1, 'broadcast', '{"beatIndex":0,"voted":999}'::jsonb, 'count', true, now())`,
          [`room:${runId}`],
        ),
      ),
    ).rejects.toThrow(/row-level security|permission denied/i);
  });

  /*
   * Presence is a write: Realtime authorises "I am here" by trying to insert.
   * It therefore lives on its own topic, which members may write to and which
   * nothing listens to for broadcast events — so the write buys a member
   * exactly the ability to be counted as present.
   */
  it("lets a member say they are here", async () => {
    const topic = `presence:${runId}`;
    await expect(
      asListener(ada, topic, (client) =>
        client.query(
          `insert into realtime.messages (topic, extension, payload, event, private, inserted_at)
           values ($1, 'presence', '{}'::jsonb, 'track', true, now())`,
          [topic],
        ),
      ),
    ).resolves.toBeDefined();
  });

  it("lets someone outside the group neither hear nor join the presence", async () => {
    const topic = `presence:${runId}`;

    const heard = await asListener(outsider, topic, async (client) => {
      const { rows } = await client.query<{ n: string }>(
        "select count(*) as n from realtime.messages where topic = $1",
        [topic],
      );
      return Number(rows[0]?.n ?? 0);
    });
    expect(heard).toBe(0);

    await expect(
      asListener(outsider, topic, (client) =>
        client.query(
          `insert into realtime.messages (topic, extension, payload, event, private, inserted_at)
           values ($1, 'presence', '{}'::jsonb, 'track', true, now())`,
          [topic],
        ),
      ),
    ).rejects.toThrow(/row-level security|permission denied/i);
  });
});

describe("a tie", () => {
  it("is written with the state that caused it and cleared when it is resolved", async () => {
    const runId = await startRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await ada.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[0],
    });
    await bo.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: KEYS[1],
    });

    await leader.client.rpc("close_vote", {
      p_run_id: runId,
      p_choice_keys: KEYS,
    });

    const tied = await runRow(runId);
    expect(tied.state).toBe("tied");
    expect(tied.tie?.tied).toEqual([KEYS[0], KEYS[1]]);
    expect(tied.tie?.tally).toEqual({
      ...Object.fromEntries(KEYS.map((key) => [key, 0])),
      [KEYS[0]!]: 1,
      [KEYS[1]!]: 1,
    });

    // No beat_results row until the leader resolves it: the beat is not over.
    const pending = await serviceClient()
      .from("beat_results")
      .select("beat_index")
      .eq("run_id", runId);
    expect(pending.data).toHaveLength(0);

    await leader.client.rpc("break_tie", {
      p_run_id: runId,
      p_choice: KEYS[0],
      p_choice_keys: KEYS,
    });

    const resolved = await runRow(runId);
    expect(resolved.state).toBe("revealing");
    expect(resolved.tie).toBeNull();
  });
});
