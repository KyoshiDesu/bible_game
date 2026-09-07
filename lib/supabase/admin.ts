import "server-only";

import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { supabaseEnv, supabaseSecretKey } from "./env";

/**
 * The server's own client. It authenticates with the secret key, which
 * bypasses row-level security completely, so everything it touches is
 * unguarded by the database and has to be guarded by the code around it.
 *
 * It exists for the two things a client genuinely cannot do: look a group up
 * by join code without `groups` being readable to strangers, and count failed
 * join attempts against an IP address the browser cannot be trusted to report.
 *
 * `server-only` above is the guard that matters — importing this from a client
 * component is a build error rather than a leaked key.
 */
export function createAdminClient(): SupabaseClient {
  const { url } = supabaseEnv();
  return createSupabaseClient(url, supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
