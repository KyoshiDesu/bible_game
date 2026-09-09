import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { localSupabase } from "../local-supabase";

const {
  url: URL,
  publishableKey: PUBLISHABLE_KEY,
  secretKey: SECRET_KEY,
  dbUrl: DB_URL,
} = localSupabase();

/** A direct Postgres connection, for the tests that need two at once. */
export const databaseUrl = DB_URL;

/** The server's client: bypasses RLS entirely. Never reaches a browser. */
export function serviceClient(): SupabaseClient {
  return createClient(URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A browser: the publishable key, row-level security in force. */
export function browserClient(): SupabaseClient {
  return createClient(URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface Actor {
  client: SupabaseClient;
  user: User;
  id: string;
}

let sequence = 0;

/** A leader: a real account with an email, as the magic link would produce. */
export async function signInIdentified(displayName: string): Promise<Actor> {
  const admin = serviceClient();
  const email = `leader-${Date.now()}-${sequence++}@example.test`;
  const password = "press-start-test-password";

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;

  const client = browserClient();
  const session = await client.auth.signInWithPassword({ email, password });
  if (session.error) throw session.error;
  const user = session.data.user;

  const profile = await client
    .from("profiles")
    .insert({ id: user.id, display_name: displayName });
  if (profile.error) throw profile.error;

  return { client, user, id: user.id };
}

/** Signs in an account that already exists, without creating a profile. */
export async function signInExisting(email: string): Promise<Actor> {
  const client = browserClient();
  const session = await client.auth.signInWithPassword({
    email,
    password: "press-start-test-password",
  });
  if (session.error) throw session.error;
  return { client, user: session.data.user, id: session.data.user.id };
}

/** A participant: an anonymous user, exactly as the join flow issues one. */
export async function signInAnonymously(): Promise<Actor> {
  const client = browserClient();
  const session = await client.auth.signInAnonymously();
  if (session.error) throw session.error;
  return { client, user: session.data.user!, id: session.data.user!.id };
}

export interface TestGroup {
  id: string;
  name: string;
  joinCode: string;
}

/** A leader creating a group, through the RPC the app calls. */
export async function createGroup(
  leader: Actor,
  name: string,
  joinCode: string,
): Promise<TestGroup> {
  const created = await leader.client.rpc("create_group", {
    p_name: name,
    p_join_code: joinCode,
  });
  if (created.error) throw created.error;
  return { id: (created.data as { id: string }).id, name, joinCode };
}

/** Joining, through the server-only RPC the join action calls. */
export async function join(
  participant: Actor,
  code: string,
  displayName: string,
): Promise<{ id: string } | { error: string }> {
  const result = await serviceClient().rpc("join_group", {
    p_profile_id: participant.id,
    p_code: code,
    p_display_name: displayName,
  });
  if (result.error) return { error: result.error.message };
  return { id: (result.data as { id: string }).id };
}

let codeCounter = 0;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Deterministic, collision-free codes so a rerun does not trip the unique index. */
export function testCode(): string {
  const value = Date.now() * 1000 + codeCounter++;
  let code = "";
  let remaining = value;
  for (let position = 0; position < 6; position++) {
    code = ALPHABET[remaining % ALPHABET.length] + code;
    remaining = Math.floor(remaining / ALPHABET.length);
  }
  return code;
}
