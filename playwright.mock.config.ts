import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/** Live imported-source verification. Own only a separate Vite process; leave the user's API/UI running. */
const port = Number(process.env.MOCK_APP_PORT ?? 3602);
export default defineConfig({
  testDir: './tests/mock',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mock-mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    { name: 'mock-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: `"${process.execPath}" "${path.resolve(__dirname, 'node_modules/vite/bin/vite.js')}" --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: __dirname,
    env: { VITE_PERFORMANCE_MOCK_SAMPLES_FILE: process.env.VITE_PERFORMANCE_MOCK_SAMPLES_FILE ?? 'data/performance-mocks/samples.json' },
    url: `http://127.0.0.1:${port}/insights/performance`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});