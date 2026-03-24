import { expect } from '@playwright/test';
import { test } from '../e2e/fixtures/extension';

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
        <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
      </div>
    </ytd-rich-item-renderer>`;

    richGrid.appendChild(contents);
    ytdApp.appendChild(richGrid);
    document.body.appendChild(ytdApp);
  });

  const video = page.locator('ytd-rich-item-renderer');
  await expect(video).toHaveAttribute('data-allowed', '');
  await expect(video).toBeVisible();

  await video.evaluate((el) => {
    const link = el.querySelector('a[href^="/@"]');
    if (!link) {
      throw new Error('link not found');
    }
    link.setAttribute('href', '/@InjectedNonWhitelistedChannel1');
    link.textContent = 'Injected Non-Whitelisted Channel 1';
  });

  await expect(video).not.toHaveAttribute('data-allowed');
  await expect(video).not.toBeVisible();
});
