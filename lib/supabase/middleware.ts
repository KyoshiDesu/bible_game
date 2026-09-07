import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseEnv } from "./env";

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
  await supabase.auth.getUser();

  return response;
}
