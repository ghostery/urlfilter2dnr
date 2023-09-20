import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'bun run serve',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
});
