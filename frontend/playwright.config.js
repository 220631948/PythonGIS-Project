import { defineConfig, devices } from '@playwright/test';

const backendBase = process.env.BACKEND_URL || 'http://localhost:8000';
const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  // Increase overall per-test timeout to allow for slower CI environments
  timeout: 120 * 1000,
  expect: {
    timeout: 20 * 1000,
  },
  // Retries and worker configuration tailored for CI to reduce flakiness
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: frontendBase,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run dev -- --host --port 5173',
          // Run the dev server from the frontend directory so npm commands resolve correctly
          cwd: './frontend',
          port: 5173,
          reuseExistingServer: true,
        },
      ],
  metadata: {
    backendBase,
    frontendBase,
  },
});