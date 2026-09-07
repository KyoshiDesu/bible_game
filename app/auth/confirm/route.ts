import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/env";

/**
 * Where a magic link lands.
 *
 * Both flows arrive here: a leader signing in, and a participant confirming an
 * email they have attached to the anonymous account they already had. The
 * second is why the destination is a parameter — a participant should come back
 * to their own page, not to a leader's group list.
 *
 * Two things here are less obvious than they look.
 *
 * The Supabase client is built in this handler rather than reused from
 * lib/supabase/server, so that the session cookies land on *this* response. A
 * route handler that returns a redirect it constructed itself does not carry
 * cookies written through the request-scoped store, and the failure is silent:
 * the link works, the session is never stored, and the next page bounces back
 * to the sign-in form.
 *
 * The redirect is relative on purpose. `request.nextUrl` reports the
 * application's canonical host rather than the one the browser actually used —
 * a link opened on 127.0.0.1 redirects to localhost — and a cookie set for one
 * of those is not sent to the other. A relative Location cannot get that wrong.
 */
function redirectTo(path: string): NextResponse {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;

  // Only same-origin paths. `next` arrives from a link in an email, which is
  // the classic way to be walked into an open redirect.
  const requested = request.nextUrl.searchParams.get("next") ?? "/groups";
  const path =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/groups";

  if (!tokenHash || !type) return redirectTo("/sign-in?expired=1");

  const response = redirectTo(path);
  const { url, publishableKey } = supabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) return redirectTo("/sign-in?expired=1");

  return response;
}
