import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/**
 * Supabase client for browser code: the participant's phone and the
 * presenter's realtime subscriptions.
 *
 * The publishable key ships in the bundle by design. Row-level security is
 * what protects the data; this key is not a secret and never was.
 */
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
