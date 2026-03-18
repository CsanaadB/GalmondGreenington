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
    const whitelist = await fs.readFile(path.resolve('tests/e2e/fixtures/whitelist.txt'), 'utf-8');
    await page.route('chrome-extension://**/whitelist.txt', async (route) => {
      await route.fulfill({ body: whitelist, contentType: 'text/plain' });
    });
    await use(page);
  },
});

test('data-allowed is removed when YouTube swaps a whitelisted video for a non-whitelisted one', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const ytdApp = document.createElement('ytd-app');
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    contents.innerHTML = `<ytd-rich-item-renderer>
      <div id="content">
        <a href="/@TheRealWalterWhiteOfficial1">TheRealWalterWhiteOfficial1</a>
      </div>
    </ytd-rich-item-renderer>`;

    richGrid.appendChild(contents);
    ytdApp.appendChild(richGrid);
    document.body.appendChild(ytdApp);
  });

  const video = page.locator('ytd-rich-item-renderer');
  await expect(video).toHaveAttribute('data-allowed', '');

  await video.evaluate((el) => {
    const link = el.querySelector('a[href^="/@"]');
    if (!link) {
      throw new Error('link not found');
    }
    link.setAttribute('href', '/@SomeNonWhitelistedChannel');
    link.textContent = 'SomeNonWhitelistedChannel';
  });

  await expect(video).not.toHaveAttribute('data-allowed');
});
