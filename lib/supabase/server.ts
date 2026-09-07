import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

/**
 * Supabase client for server components, server actions, and route handlers.
 *
 * Always create a new one per request rather than sharing a module-level
 * instance: the client carries the caller's session, and a shared one would
 * carry it across users.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot set cookies. Swallowing this is only
          // safe because the middleware refreshes the session on every
          // request; if that matcher ever stops covering a route, sessions
          // there will expire silently.
        }
      },
    },
  });
}
