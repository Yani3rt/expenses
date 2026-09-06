import { defineConfig, devices } from "@playwright/test";

const port = 43117;

export default defineConfig({
  testDir: "./test-browser",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node test-browser/fixture-server.js",
    url: `http://127.0.0.1:${port}/status`,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    env: { EXPENSE_BROWSER_PORT: String(port) },
  },
  projects: [
    {
      name: "desktop",
      testMatch: ["**/charts.spec.js", "**/transactions.spec.js"],
      use: { viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile",
      testMatch: "**/mobile.spec.js",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "reduced-motion",
      testMatch: "**/reduced-motion.spec.js",
      use: {
        viewport: { width: 1280, height: 900 },
        reducedMotion: "reduce",
      },
    },
  ],
});
