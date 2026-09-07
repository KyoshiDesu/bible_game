import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  // Tests never render Tailwind; skipping the PostCSS pipeline keeps Vite from
  // loading the ESM-only Tailwind plugin through its CJS config loader.
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // The row-level-security suite needs a running local Supabase, so it has
    // its own config and its own script rather than failing `npm test` on a
    // machine that has not started one.
    exclude: ["node_modules/**", ".next/**", "e2e/**", "tests/rls/**"],
  },
});
