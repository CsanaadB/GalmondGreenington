import { expect } from '@playwright/test';
import { test } from './fixtures/extension';
import path from 'path';
import fs from 'fs/promises';

test('toggle button in popup reveals filtered videos', async ({ context, page }) => {
  const fixture = await fs.readFile(path.resolve('tests/e2e/fixtures/youtube-homepage.html'), 'utf-8');

  let extensionId: string | undefined;
  await page.route('chrome-extension://**/whitelist.txt', async (route) => {
    extensionId = route.request().url().split('/')[2];
    await route.fallback();
  });

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: fixture, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  const whitelisted = page.locator('ytd-rich-item-renderer:has(a[href="/@WhitelistedChannel1"])').first();
  await expect(whitelisted).toBeVisible();

  const filtered = page.locator('ytd-rich-item-renderer:has(a[href="/@NonWhitelistedChannel1"])');
  await expect(filtered).not.toBeVisible();

  if (!extensionId) {
    throw new Error('extension ID not captured from route interception');
  }

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.bringToFront();
  await popup.locator('button#toggle-whitelisting').click();

  await expect(filtered).toBeVisible();
});
