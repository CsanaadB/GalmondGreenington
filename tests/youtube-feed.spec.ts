import { test, expect } from '@playwright/test';
import path from 'path';

test('finds all video items in the fixture', async ({ page }) => {
  const fixture = path.resolve('tests/fixtures/youtube-homepage.html');
  await page.goto(`file://${fixture}`);

  const videos = page.locator('ytd-rich-item-renderer');
  await expect(videos).toHaveCount(3);
});
