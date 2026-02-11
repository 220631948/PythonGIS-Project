import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  timeout: 300 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  use: {
    baseURL: 'http://localhost:5174', // Frontend port
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
