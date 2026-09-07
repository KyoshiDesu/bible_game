import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The row-level-security suite.
 *
 * These are security claims, and a claim without a test is a hope — so they run
 * against a real local Supabase over HTTP rather than against a mock or against
 * Postgres directly. Going through PostgREST is deliberate: a missing GRANT and
 * a missing policy fail in different places, and only the HTTP path exercises
 * both.
 *
 *   npx supabase start && npm run test:rls
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // Nothing here renders; skipping PostCSS keeps Vite from loading the ESM-only
  // Tailwind plugin through its CJS config loader.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "node",
    include: ["tests/rls/**/*.test.ts"],
    // One database, shared: parallel files would race on the same rows.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
