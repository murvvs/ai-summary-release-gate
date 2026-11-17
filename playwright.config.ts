import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  // No retries on purpose: a gate should treat flakiness as a signal, not hide it.
  retries: 0,
  workers: CI ? 2 : undefined,
  reporter: CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    // Deterministic checks on summary payloads. No browser needed.
    { name: 'eval', testMatch: /eval\/.*\.spec\.ts/ },
    // Dashboard behaviour against a mocked service boundary.
    { name: 'ui', testMatch: /ui\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL } },],
  webServer: {
    command: 'node server/server.js',
    url: `http://127.0.0.1:${PORT}/healthz`,
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      // Intentional-regression switch (see README). Off by default.
      BREAK_CITATION_CHECK: process.env.BREAK_CITATION_CHECK ?? '0',
    },
  },
});
