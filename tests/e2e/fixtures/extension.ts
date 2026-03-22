import { test as base, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

export const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve('extension');
    const context = await chromium.launchPersistentContext('', {
      headless: true,
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    const whitelist = await fs.readFile(path.resolve('tests/e2e/fixtures/whitelist.txt'), 'utf-8');
    await page.route('chrome-extension://**/whitelist.txt', async (route) => {
      await route.fulfill({ body: whitelist, contentType: 'text/plain' });
    });
    await use(page);
  },
});
