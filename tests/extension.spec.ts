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
  await expect(videos).toHaveCount(4);

  for (const video of await videos.all()) {
    await expect(video).not.toBeVisible();
  }
});

test('whitelisted channel\'s videos are visible on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/fixtures/youtube-homepage.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  const whitelistedChannel = '/@TheRealWalterWhiteOfficial1';

  const whitelistedVideos = page.locator(
    `ytd-rich-item-renderer:has(a[href="${whitelistedChannel}"])`
  );
  await expect(whitelistedVideos).toHaveCount(2);
  for (const video of await whitelistedVideos.all()) {
    await expect(video).toBeVisible();
  }

  const otherVideos = page.locator(
    `ytd-rich-item-renderer:not(:has(a[href="${whitelistedChannel}"]))`
  );
  await expect(otherVideos).toHaveCount(2);
  for (const video of await otherVideos.all()) {
    await expect(video).not.toBeVisible();
  }
});
