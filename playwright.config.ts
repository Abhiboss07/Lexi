import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        channel: 'chrome',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Mobile Viewport (Chrome)',
      use: { 
        ...devices['Pixel 5'],
        channel: 'chrome',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Desktop Viewport (Chrome)',
      use: { 
        channel: 'chrome',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
