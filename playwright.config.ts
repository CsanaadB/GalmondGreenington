import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['e2e/**/*.spec.ts', 'regression/**/*.spec.ts'],
  timeout: 30_000,
});
