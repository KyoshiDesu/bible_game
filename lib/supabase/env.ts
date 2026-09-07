/*
 * Supabase environment.
 *
 * The two reads below are literal `process.env.X` expressions on purpose:
 * Next inlines NEXT_PUBLIC_ variables by matching that exact syntax, so a
 * dynamic lookup would compile to `undefined` in the browser bundle and fail
 * only at runtime, in a phone's console, during a meeting.
 *
 * Validation is deliberately lazy. A missing variable should fail the request
 * that needed it, naming the variable — not fail `next build` in CI, where no
 * Supabase project is configured and none is needed.
 */

const URL_VALUE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY_VALUE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/**
 * Whether a Supabase project is configured at all.
 *
 * False in CI and in a clean checkout before a project exists. Callers that
 * genuinely need data still go through `supabaseEnv()` and still throw, so
 * this cannot quietly hide a misconfigured deployment — it only lets the
 * static pages render without one.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(URL_VALUE && PUBLISHABLE_KEY_VALUE);
}

export interface SupabaseEnv {
  url: string;
  publishableKey: string;
}

/**
 * The secret key. Server-only: it bypasses row-level security entirely, so a
 * module that reads it must never be reachable from a client component.
 */
export function supabaseSecretKey(): string {
  return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}

/** The origin this deployment is browsed at, for magic-link redirects. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function supabaseEnv(): SupabaseEnv {
  return {
    url: required("NEXT_PUBLIC_SUPABASE_URL", URL_VALUE),
    publishableKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      PUBLISHABLE_KEY_VALUE,
    ),
  };
}
