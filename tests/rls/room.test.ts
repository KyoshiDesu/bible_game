import { beforeAll, describe, expect, it } from "vitest";

import { session01Scenario } from "@/content/scenarios/session-01";
import { resolveTally, tallyVotes } from "@/lib/room/machine";

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
 * The room engine against a real database.
 *
 * The state machine is proved exhaustively as pure functions in
 * tests/room-machine.test.ts. What only a database can prove is the part that
 * involves two requests arriving at once — which is the failure that would show
 * up in front of a room, on a projector, with twelve people watching.
 */
const scenario = session01Scenario;
const KEYS = scenario.beats.map((beat) =>
  beat.choices.map((choice) => choice.key),
);
const BEAT_COUNT = scenario.beats.length;

let leader: Actor;
let otherLeader: Actor;
let group: TestGroup;
let outsider: Actor;
let voters: Actor[];

async function newRun(): Promise<string> {
  const meeting = await leader.client
    .from("meetings")
    .insert({
      group_id: group.id,
      session_number: scenario.sessionNumber,
      status: "live",
    })
    .select("id")
    .single();
  if (meeting.error) throw meeting.error;

  const run = await leader.client
    .from("scenario_runs")
    .insert({ meeting_id: meeting.data.id, scenario_id: scenario.id })
    .select("id")
    .single();
  if (run.error) throw run.error;
  return run.data.id as string;
}

async function runState(
  runId: string,
): Promise<{ state: string; current_beat: number }> {
  const { data, error } = await serviceClient()
    .from("scenario_runs")
    .select("state, current_beat")
    .eq("id", runId)
    .single();
  if (error) throw error;
  return data as { state: string; current_beat: number };
}

async function votesFor(
  runId: string,
  beat: number,
): Promise<{ choiceKey: string }[]> {
  const { data, error } = await serviceClient()
    .from("votes")
    .select("choice_key")
    .eq("run_id", runId)
    .eq("beat_index", beat);
  if (error) throw error;
  return (data as { choice_key: string }[]).map((row) => ({
    choiceKey: row.choice_key,
  }));
}

beforeAll(async () => {
  leader = await signInIdentified("Room Leader");
  otherLeader = await signInIdentified("Another Leader");
  group = await createGroup(leader, "Room group", testCode());
  await createGroup(otherLeader, "Elsewhere", testCode());

  outsider = await signInAnonymously();
  await join(
    outsider,
    (await createGroup(otherLeader, "Far away", testCode())).joinCode,
    "Outsider",
  );

  voters = [];
  for (const name of ["Ada", "Bo", "Cy", "Di", "Eve", "Fen", "Gus", "Hal"]) {
    const actor = await signInAnonymously();
    expect(await join(actor, group.joinCode, name)).toHaveProperty("id");
    voters.push(actor);
  }
});

describe("only the leader drives the run", () => {
  it.each([
    [
      "open_vote",
      (client: Actor["client"], runId: string) =>
        client.rpc("open_vote", { p_run_id: runId }),
    ],
    [
      "close_vote",
      (client: Actor["client"], runId: string) =>
        client.rpc("close_vote", { p_run_id: runId, p_choice_keys: KEYS[0] }),
    ],
    [
      "advance_run",
      (client: Actor["client"], runId: string) =>
        client.rpc("advance_run", {
          p_run_id: runId,
          p_beat_count: BEAT_COUNT,
        }),
    ],
    [
      "break_tie",
      (client: Actor["client"], runId: string) =>
        client.rpc("break_tie", {
          p_run_id: runId,
          p_choice: "a",
          p_choice_keys: KEYS[0],
        }),
    ],
  ])("refuses %s to a participant", async (_name, call) => {
    const runId = await newRun();
    const { error } = await call(voters[0]!.client, runId);
    expect(error?.message).toContain("only the leader");
  });

  it("refuses another group's leader", async () => {
    const runId = await newRun();
    const { error } = await otherLeader.client.rpc("open_vote", {
      p_run_id: runId,
    });
    expect(error?.message).toContain("only the leader");
  });

  it("does not let a participant create a run of their own", async () => {
    const { error } = await voters[0]!.client.from("scenario_runs").insert({
      meeting_id: "00000000-0000-0000-0000-000000000000",
      scenario_id: scenario.id,
    });
    expect(error).not.toBeNull();
  });
});

describe("a beat, from open to revealed", () => {
  let runId: string;

  beforeAll(async () => {
    runId = await newRun();
    expect(
      (await leader.client.rpc("open_vote", { p_run_id: runId })).error,
    ).toBeNull();
  });

  it("opens on the first beat", async () => {
    expect(await runState(runId)).toEqual({ state: "voting", current_beat: 0 });
  });

  it("refuses to open twice, so a double-tap does nothing", async () => {
    const { error } = await leader.client.rpc("open_vote", { p_run_id: runId });
    expect(error?.message).toContain("already started");
  });

  it("takes a vote, and lets the voter change their mind", async () => {
    const ada = voters[0]!;
    expect(
      (
        await ada.client.rpc("cast_vote", {
          p_run_id: runId,
          p_beat: 0,
          p_choice: "a",
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await ada.client.rpc("cast_vote", {
          p_run_id: runId,
          p_beat: 0,
          p_choice: "b",
        })
      ).error,
    ).toBeNull();

    const { data } = await ada.client.from("votes").select("choice_key");
    expect(data).toEqual([{ choice_key: "b" }]);
  });

  it("shows a voter their own vote and nobody else's", async () => {
    expect(
      (
        await voters[1]!.client.rpc("cast_vote", {
          p_run_id: runId,
          p_beat: 0,
          p_choice: "c",
        })
      ).error,
    ).toBeNull();

    const { data } = await voters[0]!.client
      .from("votes")
      .select("choice_key, profile_id");
    expect(data).toHaveLength(1);
    expect(data?.[0]?.profile_id).toBe(voters[0]!.id);
  });

  it("refuses a vote written straight into the table", async () => {
    const { error } = await voters[2]!.client.from("votes").insert({
      run_id: runId,
      beat_index: 0,
      profile_id: voters[2]!.id,
      choice_key: "a",
    });
    expect(error).not.toBeNull();
  });

  it("refuses a vote from outside the group", async () => {
    const { error } = await outsider.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: "a",
    });
    expect(error).not.toBeNull();
  });

  it("refuses a vote on a beat that is not open", async () => {
    const { error } = await voters[3]!.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 1,
      p_choice: "a",
    });
    expect(error?.message).toContain("voting is not open");
  });

  it("closes with a winner and freezes the tally, zeros included", async () => {
    // b: Ada, c: Bo. b and c tie at one each — so give b a second vote.
    expect(
      (
        await voters[3]!.client.rpc("cast_vote", {
          p_run_id: runId,
          p_beat: 0,
          p_choice: "b",
        })
      ).error,
    ).toBeNull();

    const { error } = await leader.client.rpc("close_vote", {
      p_run_id: runId,
      p_choice_keys: KEYS[0],
    });
    expect(error).toBeNull();
    expect(await runState(runId)).toEqual({
      state: "revealing",
      current_beat: 0,
    });

    const { data } = await serviceClient()
      .from("beat_results")
      .select("winning_choice, tally, decided_by_leader")
      .eq("run_id", runId)
      .eq("beat_index", 0)
      .single();
    expect(data?.winning_choice).toBe("b");
    expect(data?.decided_by_leader).toBe(false);
    // Every choice the beat offered, including the two nobody picked.
    expect(data?.tally).toEqual({ a: 0, b: 2, c: 1, d: 0 });
  });

  it("refuses a vote once the room has seen the result", async () => {
    const { error } = await voters[4]!.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: "a",
    });
    expect(error?.message).toContain("voting is not open");
  });

  it("refuses to close twice", async () => {
    const { error } = await leader.client.rpc("close_vote", {
      p_run_id: runId,
      p_choice_keys: KEYS[0],
    });
    expect(error?.message).toContain("already closed");
  });

  it("lets the room read the result, and only the room", async () => {
    const inside = await voters[0]!.client
      .from("beat_results")
      .select("winning_choice");
    expect(inside.data).toHaveLength(1);

    const outside = await outsider.client
      .from("beat_results")
      .select("winning_choice")
      .eq("run_id", runId);
    expect(outside.data).toEqual([]);
  });

  it("advances to the next beat", async () => {
    const { error } = await leader.client.rpc("advance_run", {
      p_run_id: runId,
      p_beat_count: BEAT_COUNT,
    });
    expect(error).toBeNull();
    expect(await runState(runId)).toEqual({ state: "voting", current_beat: 1 });
  });

  it("reaches complete after the last beat", async () => {
    for (let beat = 1; beat < BEAT_COUNT; beat++) {
      await voters[0]!.client.rpc("cast_vote", {
        p_run_id: runId,
        p_beat: beat,
        p_choice: "a",
      });
      expect(
        (
          await leader.client.rpc("close_vote", {
            p_run_id: runId,
            p_choice_keys: KEYS[beat],
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await leader.client.rpc("advance_run", {
            p_run_id: runId,
            p_beat_count: BEAT_COUNT,
          })
        ).error,
      ).toBeNull();
    }
    expect((await runState(runId)).state).toBe("complete");
  });
});

describe("a tie is handed to the leader", () => {
  let runId: string;

  beforeAll(async () => {
    runId = await newRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await voters[0]!.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: "a",
    });
    await voters[1]!.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: "b",
    });
    await leader.client.rpc("close_vote", {
      p_run_id: runId,
      p_choice_keys: KEYS[0],
    });
  });

  it("enters the tied state and writes nothing yet", async () => {
    expect((await runState(runId)).state).toBe("tied");
    const { data } = await serviceClient()
      .from("beat_results")
      .select("run_id")
      .eq("run_id", runId);
    expect(data).toEqual([]);
  });

  it("refuses a choice the room did not tie on", async () => {
    const { error } = await leader.client.rpc("break_tie", {
      p_run_id: runId,
      p_choice: "d",
      p_choice_keys: KEYS[0],
    });
    expect(error?.message).toContain("tied on");
  });

  it("writes exactly one result row, marked as the leader's", async () => {
    const { error } = await leader.client.rpc("break_tie", {
      p_run_id: runId,
      p_choice: "b",
      p_choice_keys: KEYS[0],
    });
    expect(error).toBeNull();
    expect((await runState(runId)).state).toBe("revealing");

    const { data } = await serviceClient()
      .from("beat_results")
      .select("winning_choice, tally, decided_by_leader")
      .eq("run_id", runId);
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({
      winning_choice: "b",
      decided_by_leader: true,
    });
    expect(data?.[0]?.tally).toEqual({ a: 1, b: 1, c: 0, d: 0 });
  });

  it("treats a room that did not vote as a tie rather than a winner", async () => {
    const silent = await newRun();
    await leader.client.rpc("open_vote", { p_run_id: silent });
    await leader.client.rpc("close_vote", {
      p_run_id: silent,
      p_choice_keys: KEYS[0],
    });
    expect((await runState(silent)).state).toBe("tied");
  });
});

describe("closing refuses to guess", () => {
  it("will not close against a beat that does not offer what was voted for", async () => {
    const runId = await newRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });
    await voters[0]!.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: 0,
      p_choice: "d",
    });

    const { error } = await leader.client.rpc("close_vote", {
      p_run_id: runId,
      p_choice_keys: ["a", "b", "c"],
    });
    expect(error?.message).toContain("does not offer");
    // And the run is untouched, so the leader can retry with the right beat.
    expect((await runState(runId)).state).toBe("voting");
  });
});

describe("a vote racing the close", () => {
  /**
   * The one that matters. Everything else here would show up in review; this
   * would show up on a projector.
   *
   * Each round fires every voter at the same moment as the close. Whatever
   * order they land in, the invariant is the same: the tally frozen into
   * beat_results must equal the tally you would compute from the votes that
   * exist. A vote that landed after the aggregate would break it.
   */
  it.each([1, 2, 3, 4, 5])("round %i never tears the tally", async () => {
    const runId = await newRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });

    const keys = KEYS[0]!;
    await Promise.all([
      ...voters.map((voter, index) =>
        voter.client.rpc("cast_vote", {
          p_run_id: runId,
          p_beat: 0,
          p_choice: keys[index % keys.length],
        }),
      ),
      leader.client.rpc("close_vote", { p_run_id: runId, p_choice_keys: keys }),
    ]);

    const state = await runState(runId);
    expect(["revealing", "tied"]).toContain(state.state);

    const cast = await votesFor(runId, 0);
    const computed = tallyVotes(cast, scenario.beats[0]!);
    const resolution = resolveTally(computed);

    const { data } = await serviceClient()
      .from("beat_results")
      .select("winning_choice, tally")
      .eq("run_id", runId)
      .eq("beat_index", 0)
      .maybeSingle();

    if (data) {
      expect(state.state).toBe("revealing");
      expect(data.tally).toEqual(computed);
      expect(resolution.kind).toBe("winner");
      if (resolution.kind === "winner") {
        expect(data.winning_choice).toBe(resolution.winner);
      }
    } else {
      expect(state.state).toBe("tied");
      expect(resolution.kind).toBe("tie");
    }
  });
});

describe("a vote arriving while a close is in flight", () => {
  /**
   * The concurrent-fire rounds above assert the invariant but cannot force the
   * window open — the requests are too fast to interleave reliably. This one
   * holds the window open by hand.
   *
   * A second connection takes the same row lock `close_vote` takes and keeps
   * the transaction open. A vote cast over HTTP meanwhile must not slip past:
   * it blocks on the shared lock, and once the close commits it reads the state
   * that close actually left behind and is refused. Without `for share` in
   * `cast_vote` the insert would land immediately, after the tally was taken —
   * a vote that exists and is missing from what the room was shown.
   */
  it("blocks on the lock and is then refused, rather than landing uncounted", async () => {
    const runId = await newRun();
    await leader.client.rpc("open_vote", { p_run_id: runId });

    const closer = new Client({ connectionString: databaseUrl });
    await closer.connect();

    try {
      await closer.query("begin");
      await closer.query(
        "select * from public.scenario_runs where id = $1 for update",
        [runId],
      );

      // Cast, but do not await: this call is expected to block.
      const casting = voters[0]!.client.rpc("cast_vote", {
        p_run_id: runId,
        p_beat: 0,
        p_choice: "a",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(
        await votesFor(runId, 0),
        "a vote landed while the close held the lock",
      ).toEqual([]);

      // Finish the close, exactly as close_vote would.
      await closer.query(
        "insert into public.beat_results (run_id, beat_index, winning_choice, tally) " +
          'values ($1, 0, \'a\', \'{"a":0,"b":0,"c":0,"d":0}\'::jsonb)',
        [runId],
      );
      await closer.query(
        "update public.scenario_runs set state = 'revealing' where id = $1",
        [runId],
      );
      await closer.query("commit");

      const result = await casting;
      expect(result.error?.message).toContain("voting is not open");
      expect(await votesFor(runId, 0)).toEqual([]);
    } finally {
      await closer.query("rollback").catch(() => undefined);
      await closer.end();
    }
  });
});
