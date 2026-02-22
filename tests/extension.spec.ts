import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';

const test = base.extend({
  context: async ({}, use) => {
    const extensionPath = path.resolve('extension');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
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
    await use(page);
  },
});

test('extension hides all videos on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/fixtures/youtube-homepage.html');
  await page.goto(`file://${fixture}`);

  const videos = page.locator('ytd-rich-item-renderer');
  await expect(videos).toHaveCount(3);

  for (const video of await videos.all()) {
    await expect(video).not.toBeVisible();
  }
});
