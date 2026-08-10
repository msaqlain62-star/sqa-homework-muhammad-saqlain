import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },

  // The agent is a shared live service. Running these in parallel mostly buys
  // rate-limit flakes, so throughput is traded for signal.
  fullyParallel: false,
  workers: 1,

  // One retry only: it separates a genuine break from live-service noise
  // without hiding a real flake behind three attempts.
  retries: process.env.CI ? 1 : 0,

  reporter: [['html', { outputFolder: 'artifacts/report', open: 'never' }], ['list']],

  use: {
    baseURL: 'https://ask.permission.ai/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
