import { test as base, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

const test = base.extend({
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

test('data-layer interception filters browse response by whitelist', async ({ page }) => {
  const shell = await fs.readFile(path.resolve('tests/e2e/fixtures/youtube-shell.html'), 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: shell, contentType: 'text/html' });
  });

  const browseFixture = await fs.readFile(path.resolve('tests/e2e/fixtures/innertube-browse.json'), 'utf-8');

  await page.route('**/youtubei/v1/browse**', async (route) => {
    await route.fulfill({ body: browseFixture, contentType: 'application/json' });
  });

  await page.goto('https://www.youtube.com/');

  const result = await page.evaluate(async () => {
    const response = await fetch('/youtubei/v1/browse', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return response.json();
  });

  const items = result.onResponseReceivedActions[0]
    .appendContinuationItemsAction.continuationItems;
  const videoIds = items.map(item => item.richItemRenderer.content.lockupViewModel.contentId);

  expect(videoIds).toEqual(['whitelisted-video-1', 'whitelisted-video-2']);
});
