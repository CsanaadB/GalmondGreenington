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

test('extension filters videos by whitelist on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/fixtures/youtube-homepage.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  const whitelistedChannels = ['/@TheRealWalterWhiteOfficial1', '/@detectiveRust999'];

  for (const channel of whitelistedChannels) {
    const videos = page.locator(
      `ytd-rich-item-renderer:has(a[href="${channel}"])`
    );
    expect(await videos.count()).toBeGreaterThan(0);
    for (const video of await videos.all()) {
      await expect(video).toHaveAttribute('data-allowed', '');
      await expect(video).toBeVisible();
    }
  }

  const blockedChannelSelector = whitelistedChannels
    .map((channel) => `:not(:has(a[href="${channel}"]))`)
    .join('');
  const blockedVideos = page.locator(
    `ytd-rich-item-renderer${blockedChannelSelector}`
  );
  await expect(blockedVideos).toHaveCount(2);
  for (const video of await blockedVideos.all()) {
    await expect(video).not.toBeVisible();
  }
});
