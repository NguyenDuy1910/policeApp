import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const repositoryRoot = process.cwd();
const runtimeDirectory = resolve(repositoryRoot, 'artifacts/.tmp/e2e');

export default defineConfig({
  testDir: '.',
  testMatch: ['admin/**/*.spec.ts', 'cross-system/**/*.spec.ts'],
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  forbidOnly: true,
  retries: 0,
  outputDir: resolve(repositoryRoot, 'artifacts/tests/results'),
  reporter: [['line'], ['html', { outputFolder: resolve(repositoryRoot, 'artifacts/tests/report'), open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:5179',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: [
        `rm -rf "${runtimeDirectory}"`,
        `mkdir -p "${runtimeDirectory}/uploads"`,
        [
          `DATABASE_PATH="${runtimeDirectory}/vnpolice-care.sqlite"`,
          `UPLOAD_DIR="${runtimeDirectory}/uploads"`,
          'AUTO_SEED=true',
          'PORT=3100',
          'ADMIN_ORIGIN=http://127.0.0.1:5179',
          'SESSION_SECRET=playwright-isolated-session-secret-at-least-32-characters',
          'ADMIN_USERNAME=admin',
          'ADMIN_PASSWORD=DemoAdmin!2026',
          'ADMIN_DISPLAY_NAME="Trực ban Trung tâm Chỉ huy"',
          'node apps/server/dist/main.js',
        ].join(' '),
      ].join(' && '),
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:3100/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'VITE_API_URL=http://127.0.0.1:3100/api npm run dev -w @vnpolice/admin -- --host 127.0.0.1 --port 5179',
      cwd: repositoryRoot,
      url: 'http://127.0.0.1:5179',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
