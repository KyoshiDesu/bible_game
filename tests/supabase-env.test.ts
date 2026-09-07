import { afterEach, describe, expect, it, vi } from "vitest";

/*
 * The environment helper is the one place that decides whether the
 * application has a backend at all. Two behaviours matter and are easy to
 * break by accident:
 *
 *   - a missing variable fails loudly, naming the variable, rather than
 *     surfacing as an opaque error from inside the Supabase SDK;
 *   - an unconfigured checkout still renders, because CI builds the static
 *     prep surface with no project.
 */

async function loadEnvModule() {
  vi.resetModules();
  return import("@/lib/supabase/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("supabase environment", () => {
  it("reports an unconfigured project instead of throwing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { isSupabaseConfigured } = await loadEnvModule();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("names the missing url", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");

    const { supabaseEnv } = await loadEnvModule();
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("names the missing publishable key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { supabaseEnv } = await loadEnvModule();
    expect(() => supabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  });

  it("returns both values when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");

    const { isSupabaseConfigured, supabaseEnv } = await loadEnvModule();
    expect(isSupabaseConfigured()).toBe(true);
    expect(supabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_x",
    });
  });
});
