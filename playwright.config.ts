import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: '.cache/playwright-results',
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    headless: true,
    launchOptions: process.env.CHROMIUM_EXECUTABLE
      ? {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--disable-gpu'],
        }
      : {},
  },
});
