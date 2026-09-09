/**
 * A room that is not there.
 *
 * A leader should be able to run a whole scenario, on the real projector, with
 * the real database, before doing it in front of anyone — and the part they
 * most need to practise is the part they cannot practise alone: twelve people
 * voting while a counter climbs, and a beat that comes back tied.
 *
 * So this makes twelve accounts, puts them in a group, and then sits and
 * watches. When the leader opens a vote, they vote — staggered, the way a room
 * does, not all at once. One beat per run is rigged to tie, because breaking a
 * tie in front of a room is the moment a leader will otherwise meet for the
 * first time while everybody is watching.
 *
 * It is idempotent: run it again and it finds what it made last time.
 *
 *   npm run rehearse
 *
 * It needs the secret key, which bypasses row-level security — that is the
 * whole reason it can create accounts — so it is a script, it is never
 * imported by the application, and it refuses to run against anything whose
 * URL it was not explicitly given.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { findScenario, scenarios } from "@/content";
import { type Beat, type Scenario } from "@/content/scenario-schema";

import { splitFor } from "./room-split";

const GROUP_NAME = "Rehearsal";
/** Six characters from the join-code alphabet, so it is typeable and stable. */
const JOIN_CODE = "REHEAR";
const PASSWORD = "press-start-rehearsal";

/** A room of twelve, which is the size the curriculum is written for. */
const ROOM = [
  "Ada",
  "Bo",
  "Cai",
  "Dee",
  "Efe",
  "Fen",
  "Gil",
  "Hana",
  "Iva",
  "Jo",
  "Kit",
  "Lena",
];

// --------------------------------------------------------------- environment

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Start the local stack and write .env.local:\n` +
        `  npx supabase start\n` +
        `  { echo "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000"; npm run --silent supabase:env; } > .env.local`,
    );
  }
  return value;
}

const URL = required("NEXT_PUBLIC_SUPABASE_URL");
const PUBLISHABLE_KEY = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const SECRET_KEY = required("SUPABASE_SECRET_KEY");
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

/**
 * Somewhere it is safe to invent twelve people.
 *
 * This writes with the secret key, so pointing it at the wrong project would
 * put a group called Rehearsal and twelve accounts into somebody's real
 * church. Local is assumed; anything else has to be asked for out loud, which
 * is what the phase-8 rehearsal against staging does.
 */
function permitted(url: string): boolean {
  const host = new globalThis.URL(url).hostname;
  if (host === "127.0.0.1" || host === "localhost") return true;
  return process.argv.includes("--remote");
}

if (!permitted(URL)) {
  process.stderr.write(
    `Refusing to seed ${URL}.\n` +
      `That is not a local Supabase. If you meant it — a staging project, for a\n` +
      `rehearsal — say so: npm run rehearse -- --remote\n`,
  );
  process.exit(1);
}

const admin = createClient(URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function say(line: string): void {
  process.stdout.write(`${line}\n`);
}

// ------------------------------------------------------------------- people

interface Person {
  name: string;
  id: string;
  client: SupabaseClient;
}

/** Creates the account if it is not there, and signs it in either way. */
async function person(name: string, address: string): Promise<Person> {
  const created = await admin.auth.admin.createUser({
    email: address,
    password: PASSWORD,
    email_confirm: true,
  });
  // Already exists is the ordinary case on the second run, not a failure.
  if (
    created.error &&
    !/already been registered|already exists/i.test(created.error.message)
  ) {
    throw created.error;
  }

  const client = createClient(URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const session = await client.auth.signInWithPassword({
    email: address,
    password: PASSWORD,
  });
  if (session.error) throw session.error;
  const id = session.data.user.id;

  const profile = await admin
    .from("profiles")
    .upsert({ id, display_name: name }, { onConflict: "id" });
  if (profile.error) throw profile.error;

  return { name, id, client };
}

// -------------------------------------------------------------------- group

async function ensureGroup(leaderId: string): Promise<string> {
  const existing = await admin
    .from("groups")
    .select("id")
    .eq("join_code", JOIN_CODE)
    .is("archived_at", null)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let groupId = (existing.data as { id: string } | null)?.id;
  if (!groupId) {
    const created = await admin
      .from("groups")
      .insert({ name: GROUP_NAME, leader_id: leaderId, join_code: JOIN_CODE })
      .select("id")
      .single();
    if (created.error) throw created.error;
    groupId = created.data.id as string;
  }

  return groupId;
}

async function ensureMember(
  groupId: string,
  profileId: string,
  role: "leader" | "participant",
): Promise<void> {
  const { error } = await admin
    .from("memberships")
    .upsert(
      { group_id: groupId, profile_id: profileId, role },
      { onConflict: "group_id,profile_id" },
    );
  if (error) throw error;
}

// ------------------------------------------------------------------- voting

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function voteAsRoom(
  room: Person[],
  runId: string,
  beat: Beat,
  tie: boolean,
): Promise<void> {
  const ballot = splitFor(beat, room.length, tie);
  // A tie can need a voter fewer than the room has — an odd number cannot
  // divide in two — so the ballot leads and anybody past the end of it sits
  // this beat out, the way a person whose phone has died does.
  const voting = room.slice(0, ballot.length);
  say(
    `   ${voting.length} of ${room.length} voting${tie ? " — rigged to tie, so you can practise breaking one" : ""}`,
  );

  for (const [index, voter] of voting.entries()) {
    // Staggered, because a counter that jumps from 0 to 12 teaches a leader
    // nothing about when a room has actually finished.
    await wait(300 + Math.round(600 * ((index * 7) % 5) * 0.2));
    const { error } = await voter.client.rpc("cast_vote", {
      p_run_id: runId,
      p_beat: beat.index,
      p_choice: ballot[index]!,
    });
    if (error) {
      // Voting closed mid-round is a legitimate thing for a leader to do.
      say(`   ${voter.name} could not vote: ${error.message}`);
      return;
    }
  }
}

// -------------------------------------------------------------------- watch

interface RunRow {
  id: string;
  scenario_id: string;
  state: string;
  current_beat: number;
}

async function liveRun(groupId: string): Promise<RunRow | null> {
  const { data, error } = await admin
    .from("scenario_runs")
    .select(
      "id, scenario_id, state, current_beat, meetings!inner ( group_id, status )",
    )
    .eq("meetings.group_id", groupId)
    .eq("meetings.status", "live")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const rows = data as unknown as RunRow[];
  return rows[0] ?? null;
}

async function watch(groupId: string, room: Person[]): Promise<never> {
  say("");
  say("Watching. Open a vote on the projector and the room will answer.");
  say("Ctrl-C when you are done.");

  let announced = "";
  let votedOn = "";
  let tieBeat: number | null = null;
  let scenario: Scenario | undefined;

  for (;;) {
    const run = await liveRun(groupId);

    if (!run) {
      if (announced !== "none") {
        say("");
        say("Nothing live. Start a meeting at " + `${SITE}/present`);
        announced = "none";
      }
      await wait(2000);
      continue;
    }

    if (announced !== run.id) {
      scenario = findScenario(run.scenario_id);
      // The middle beat, so the leader meets a tie with the session still to
      // run rather than as the last thing that happens.
      tieBeat = scenario ? Math.floor(scenario.beats.length / 2) : null;
      say("");
      say(`Live: ${scenario?.caseTitle ?? run.scenario_id}`);
      announced = run.id;
      votedOn = "";
    }

    const key = `${run.id}:${run.current_beat}`;
    if (run.state === "voting" && key !== votedOn && scenario) {
      const beat = scenario.beats[run.current_beat];
      if (beat) {
        votedOn = key;
        say(`Beat ${run.current_beat + 1}: ${beat.prompt}`);
        await voteAsRoom(room, run.id, beat, run.current_beat === tieBeat);
      }
    }

    await wait(1200);
  }
}

// --------------------------------------------------------------------- main

async function main(): Promise<void> {
  const leaderAddress =
    process.argv.slice(2).find((argument) => argument.includes("@")) ??
    "rehearsal-leader@example.test";

  say(`Supabase: ${URL}`);
  say(`Leader:   ${leaderAddress}`);

  const leader = await person("Rehearsal Leader", leaderAddress);
  const groupId = await ensureGroup(leader.id);
  await ensureMember(groupId, leader.id, "leader");

  const room: Person[] = [];
  for (const name of ROOM) {
    const member = await person(
      name,
      `rehearsal-${name.toLowerCase()}@example.test`,
    );
    await ensureMember(groupId, member.id, "participant");
    room.push(member);
  }

  // Built the way supabase/templates/magic_link.html builds it, not the way
  // generateLink hands it over. Its `action_link` points at Supabase's own
  // verify endpoint, which returns the tokens in a URL fragment the server
  // never sees — the same reason this project ships its own templates.
  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: leaderAddress,
  });
  if (link.error) throw link.error;
  const signIn =
    `${SITE}/auth/confirm` +
    `?token_hash=${link.data.properties.hashed_token}&type=email`;

  say("");
  say(`Group "${GROUP_NAME}" with ${room.length} participants in it.`);
  say(`Join code:   ${JOIN_CODE}`);
  say(`Projector:   ${SITE}/present`);
  say(`Sign in:     ${signIn}`);
  say("");
  say(
    `Playable: ${scenarios.map((one) => `${one.sessionNumber}. ${one.caseTitle}`).join(" · ")}`,
  );

  // Seeding and simulating are separate jobs: a leader who wants a group to
  // poke at should not have to leave a process running to get one.
  if (process.argv.includes("--setup-only")) {
    for (const member of [leader, ...room]) await member.client.auth.signOut();
    return;
  }

  await watch(groupId, room);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
