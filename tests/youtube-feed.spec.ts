import { test, expect } from '@playwright/test';
import path from 'path';

test('hides all videos on the homepage', async ({ page }) => {
  const fixture = path.resolve('tests/fixtures/youtube-homepage.html');
  await page.goto(`file://${fixture}`);

  const css = path.resolve('extension/style.css');
  await page.addStyleTag({ path: css });

  const videos = page.locator('ytd-rich-item-renderer');
  await expect(videos).toHaveCount(3);

  for (const video of await videos.all()) {
    await expect(video).not.toBeVisible();
  }
});
