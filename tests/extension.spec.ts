import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

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
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  const videos = page.locator('ytd-rich-item-renderer');
  await expect(videos).toHaveCount(3);

  for (const video of await videos.all()) {
    await expect(video).not.toBeVisible();
  }
});
