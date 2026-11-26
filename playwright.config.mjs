import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4180' },
  webServer: { command: 'node scripts/serve.mjs 4180', url: 'http://localhost:4180/index.html', reuseExistingServer: true },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
