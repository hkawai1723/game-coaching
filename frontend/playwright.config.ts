import { defineConfig, devices } from '@playwright/test';

// E2E は起動・ブラウザ操作を伴い桁違いに遅い。日常のゲートには含めず、明示的に頼まれたときだけ回す
// （.claude/skills/verification-loop/references/frontend-gates.md）。
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // preview は dist/ が要る。build を含めて毎回作り直す（stale な dist を見ないため）
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
