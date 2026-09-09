import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;

const CONTENT_SPEC = /prep-content\.spec\.ts/;
// These need a local Supabase (`npx supabase start`), so they run under their
// own project and their own script rather than failing the default suite.
const SUPABASE_SPECS = /(identity|workbook|room|live-a11y)\.spec\.ts/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Content parity is an HTTP check over the rendered HTML, so it runs once
    // rather than once per browser.
    { name: "content", testMatch: CONTENT_SPEC },
    {
      name: "supabase",
      testMatch: SUPABASE_SPECS,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testIgnore: [CONTENT_SPEC, SUPABASE_SPECS],
      use: { ...devices["Desktop Chrome"] },
    },
    // Participants are on phones; the room view is tested where it is used.
    {
      name: "mobile",
      testIgnore: [CONTENT_SPEC, SUPABASE_SPECS],
      use: { ...devices["Pixel 7"] },
    },
  ],
  // Tests run against a production build: the prep surface is statically
  // rendered, and dev-mode rendering would not exercise that.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
