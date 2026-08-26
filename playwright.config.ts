import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

/**
 * One runner for three suites:
 *   tests/unit — pure module tests (composers, formatters, config, i18n scan)
 *   tests/api  — BFF contract + entitlement tests (replaces scripts/smoke.sh)
 *   tests/e2e  — browser journeys on the 375-base mobile shell
 *
 * `reuseExistingServer: false` is deliberate: a stale process squatting 4600 or
 * 3600 must fail loudly instead of silently serving a different build.
 */
const SVC_DIR = process.env.SVC_DIR ?? path.resolve(__dirname, '../PruactionBackend');
const APP_PORT = Number(process.env.APP_PORT ?? 3600);
const SVC_PORT = Number(process.env.SVC_PORT ?? 4600);
const isCI = !!process.env.CI;

/** tests/unit are pure module tests — they need no servers (PW_SKIP_WEBSERVER=1). */
const skipWebServer = process.env.PW_SKIP_WEBSERVER === '1';

const webServer = [
  {
    command: `MONGODB_URI='' PORT=${SVC_PORT} node ${JSON.stringify(`${SVC_DIR}/dist/src/server.js`)}`,
    url: `http://127.0.0.1:${SVC_PORT}/healthz`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore' as const,
    stderr: 'pipe' as const,
  },
  {
    command: `CONTESTS_API_URL=http://127.0.0.1:${SVC_PORT}/contests/v1 npx next dev -p ${APP_PORT}`,
    url: `http://127.0.0.1:${APP_PORT}/insights/performance`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore' as const,
    stderr: 'pipe' as const,
  },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'unit',
      testDir: './tests/unit',
      use: {},
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      testIgnore: '**/contest-*.spec.ts',
      // 375-base mobile shell (docs/figma-extract.md).
      use: { ...devices['Pixel 7'], isMobile: true, viewport: { width: 375, height: 812 } },
    },
    {
      name: 'desktop',
      testDir: './tests/e2e',
      testMatch: '**/contest-*.spec.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: skipWebServer ? undefined : webServer,
});
