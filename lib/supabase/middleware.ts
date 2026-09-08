import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseEnv } from "./env";

/**
 * How long to wait for a token refresh before giving up on it.
 *
 * Church wifi that is associated but not reaching the internet is worse than
 * wifi that is down: a request to an unreachable host hangs rather than fails,
 * and this middleware runs on every rendering request — so without a deadline
 * a bad hall makes every page in the application, including the offline deck,
 * hang instead of load. Four seconds is long enough for a slow refresh and
 * short enough that a leader notices a delay rather than a broken meeting.
 */
const REFRESH_TIMEOUT_MS = 4000;

/**
 * Refreshes the caller's auth token and writes the refreshed cookies onto the
 * response.
 *
 * Participants are anonymous Supabase users whose sessions have to survive a
 * whole semester of intermittent visits, so this runs on every request that
 * renders or mutates.
 */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    // No project yet: a clean checkout, or CI building the prep surface,
    // which is static and needs no session. Nothing to refresh.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = supabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
        }),
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // This call is the whole point of the middleware. It revalidates the token
  // and, when it has expired, writes a fresh one through setAll above.
  // Constructing the client without calling it refreshes nothing.
  //
  // Nothing may run between createServerClient and here: @supabase/ssr
  // depends on the cookie writes landing on the response object returned
  // below, and an early return or an inserted await loses them.
  try {
    await supabase.auth.getUser();
  } catch {
    // Unreachable, or slower than the deadline. The session is not refreshed
    // and the request carries on with whatever cookies it arrived with —
    // which is what lets the static show-of-hands deck render in a hall with
    // no working network. A page that genuinely needs data still fails, in
    // its own error boundary, where it can say so.
  }

  return response;
}
