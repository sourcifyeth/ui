import { defineConfig, devices } from "@playwright/test";

// Smoke tests for the production build. They check what unit tests cannot see: index.html, fonts, assets,
// the fallback to index.html for unknown paths, and the redirects of old hash URLs.
// Run `npm run build` first, then `npm run test:e2e`.
export default defineConfig({
  testDir: "e2e",
  // The .e2e.ts suffix keeps these files away from Vitest, which picks up *.test.ts and *.spec.ts.
  testMatch: "**/*.e2e.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
