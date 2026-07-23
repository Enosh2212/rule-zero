import { defineConfig, devices } from "@playwright/test";

const testEnvironment = {
  ENVIRONMENT: "test",
  APPROVAL_SIGNING_KEY: "ci-test-only-approval-signing-key-32-chars",
  RECOVERY_SIGNING_KEY: "ci-test-only-recovery-signing-key-32-chars",
  AUDIT_SIGNING_KEY: "ci-test-only-audit-signing-key-value-32",
  CORS_ORIGINS: "http://127.0.0.1:3100",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8100",
      cwd: "../backend",
      url: "http://127.0.0.1:8100/health",
      env: testEnvironment,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
      cwd: ".",
      url: "http://127.0.0.1:3100",
      env: { NEXT_PUBLIC_API_URL: "http://127.0.0.1:8100" },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
