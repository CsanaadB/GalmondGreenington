import { expect } from '@playwright/test';
import { test } from './fixtures/extension';
import path from 'path';
import fs from 'fs/promises';

const videoTemplate = (channel: string): string => `
  <ytd-rich-item-renderer class="style-scope ytd-rich-grid-renderer">
    <div id="content" class="style-scope ytd-rich-item-renderer">
      <yt-lockup-view-model>
        <div class="yt-lockup-view-model yt-lockup-view-model--vertical">
          <div class="yt-lockup-view-model__metadata">
            <yt-lockup-metadata-view-model>
              <div class="yt-lockup-metadata-view-model__text-container">
                <div class="yt-lockup-metadata-view-model__metadata">
                  <yt-content-metadata-view-model>
                    <div class="yt-content-metadata-view-model__metadata-row">
                      <span class="yt-core-attributed-string">
                        <span>
                          <a class="yt-core-attributed-string__link" href="${channel}">Channel</a>
                        </span>
                      </span>
                    </div>
                  </yt-content-metadata-view-model>
                </div>
              </div>
            </yt-lockup-metadata-view-model>
          </div>
        </div>
      </yt-lockup-view-model>
    </div>
  </ytd-rich-item-renderer>`;

test('extension filters videos by whitelist on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-homepage.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@WhitelistedChannel1"])')).toBeVisible();
  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@WhitelistedChannel2"])')).toBeVisible();
  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@NonWhitelistedChannel1"])')).not.toBeVisible();
  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@NonWhitelistedChannel2"])')).not.toBeVisible();

  await page.locator('#contents').evaluate((el, videoElement) => {
    el.insertAdjacentHTML('beforeend', videoElement);
  }, videoTemplate('/@InjectedWhitelistedChannel1'));

  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedWhitelistedChannel1"])')).toBeVisible();

  await page.locator('#contents').evaluate((el, videoElement) => {
    el.insertAdjacentHTML('beforeend', videoElement);
  }, videoTemplate('/@InjectedNonWhitelistedChannel1'));

  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])')).not.toBeVisible();
});

test('extension filters infinite scroll videos after late-loading #contents', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const ytdApp = document.createElement('ytd-app');
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    richGrid.appendChild(contents);
    ytdApp.appendChild(richGrid);
    document.body.appendChild(ytdApp);
  });

  const allowedVideos = page.locator('ytd-rich-item-renderer[data-allowed]');

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedWhitelistedChannel1'));

  await expect(allowedVideos).toHaveCount(1);
  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedWhitelistedChannel1"])')).toBeVisible();

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedWhitelistedChannel2'));

  await expect(allowedVideos).toHaveCount(2);
  await expect(page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedWhitelistedChannel2"])')).toBeVisible();

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedNonWhitelistedChannel1'));

  await expect(allowedVideos).toHaveCount(2);
  const nonWhitelisted = page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])');
  await expect(nonWhitelisted).not.toBeVisible();
});

test('extension filters video placeholders once they get populated', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const ytdApp = document.createElement('ytd-app');
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    const placeholder = document.createElement('ytd-rich-item-renderer');
    contents.appendChild(placeholder);

    richGrid.appendChild(contents);
    ytdApp.appendChild(richGrid);
    document.body.appendChild(ytdApp);
  });

  const videoPlaceholder = page.locator('ytd-rich-item-renderer');
  await expect(videoPlaceholder).not.toBeVisible();

  await videoPlaceholder.evaluate((el) => {
    el.innerHTML = `<div id="content">
      <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
    </div>`;

    document.dispatchEvent(new CustomEvent('yt-renderidom-finished', { bubbles: true }));
  });

  await expect(videoPlaceholder).toBeVisible();
});




test('extension resolves the correct #contents when multiple exist on search page', async ({ page }) => {
  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  await page.evaluate(() => {
    const wrongParent = document.createElement('ytd-secondary-search-container-renderer');
    const wrongContents = document.createElement('div');
    wrongContents.id = 'contents';

    wrongContents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel2">Injected Whitelisted Channel 2</a>
      </div>
    </ytd-video-renderer>`;

    wrongParent.appendChild(wrongContents);
    document.body.appendChild(wrongParent);
  });

  await page.evaluate(() => {
    const ytdApp = document.createElement('ytd-app');
    const sectionList = document.createElement('ytd-section-list-renderer');
    const rightContents = document.createElement('div');
    rightContents.id = 'contents';

    rightContents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
      </div>
    </ytd-video-renderer>`;

    sectionList.appendChild(rightContents);
    ytdApp.appendChild(sectionList);
    document.body.appendChild(ytdApp);
  });

  const rightVideo = page.locator('ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel1"])');
  await expect(rightVideo).toBeVisible();

  const wrongVideo = page.locator('ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel2"])');
  await expect(wrongVideo).not.toBeVisible();
});


test('extension filters videos by whitelist on youtube search results', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-search.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  await expect(page.locator('ytd-video-renderer:has(a[href="/@WhitelistedChannel1"])')).toBeVisible();
  await expect(page.locator('ytd-video-renderer:has(a[href="/@WhitelistedChannel2"])')).toBeVisible();
  await expect(page.locator('ytd-video-renderer:has(a[href="/@NonWhitelistedChannel1"])')).not.toBeVisible();
  await expect(page.locator('ytd-video-renderer:has(a[href="/@NonWhitelistedChannel2"])')).not.toBeVisible();

  await page.locator('ytd-item-section-renderer #contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, `<ytd-video-renderer>
    <div id="channel-info">
      <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
    </div>
  </ytd-video-renderer>`);

  await expect(page.locator('ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel1"])')).toBeVisible();

  await page.locator('ytd-item-section-renderer #contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, `<ytd-video-renderer>
    <div id="channel-info">
      <a href="/@InjectedNonWhitelistedChannel1">Injected Non-Whitelisted Channel 1</a>
    </div>
  </ytd-video-renderer>`);

  await expect(page.locator('ytd-video-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])')).not.toBeVisible();
});

test('extension filters videos after SPA navigation from homepage to search', async ({ page }) => {
  const homeHtml = await fs.readFile(path.resolve('tests/e2e/fixtures/youtube-homepage.html'), 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: homeHtml, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.locator('ytd-app').evaluate((ytdApp) => {
    const sectionList = document.createElement('ytd-section-list-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    contents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
      </div>
    </ytd-video-renderer>`;

    sectionList.appendChild(contents);
    ytdApp.appendChild(sectionList);

    document.dispatchEvent(new CustomEvent('yt-navigate-finish', {
      detail: { pageType: 'search' },
    }));
  });

  const searchResultVideo = page.locator(
    'ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel1"])'
  );
  await expect(searchResultVideo).toBeVisible();

  await page.locator('ytd-video-renderer').evaluate((existing) => {
    const parent = existing.parentElement;
    if (!parent) {
      throw new Error('video has no parent');
    }

    parent.insertAdjacentHTML('beforeend', `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel2">Injected Whitelisted Channel 2</a>
      </div>
    </ytd-video-renderer>`);
  });

  const scrolledVideo = page.locator(
    'ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel2"])'
  );
  await expect(scrolledVideo).toBeVisible();

  await page.locator('ytd-video-renderer').first().evaluate((existing) => {
    const parent = existing.parentElement;
    if (!parent) {
      throw new Error('video has no parent');
    }

    parent.insertAdjacentHTML('beforeend', `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedNonWhitelistedChannel1">Injected Non-Whitelisted Channel 1</a>
      </div>
    </ytd-video-renderer>`);
  });

  const nonWhitelistedVideo = page.locator(
    'ytd-video-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])'
  );
  await expect(nonWhitelistedVideo).not.toBeVisible();

  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('yt-navigate-finish', {
      detail: { pageType: 'browse' },
    }));
  });

  await page.locator('ytd-video-renderer').first().evaluate((existing) => {
    const parent = existing.parentElement;
    if (!parent) {
      throw new Error('video has no parent');
    }

    parent.insertAdjacentHTML('beforeend', `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel3">Injected Whitelisted Channel 3</a>
      </div>
    </ytd-video-renderer>`);
  });

  const videoAfterSecondNav = page.locator(
    'ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel3"])'
  );
  await expect(videoAfterSecondNav).toBeVisible();
});

test('extension filters search videos when DOM is built dynamically inside ytd-app', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-video-placeholder.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  await page.locator('ytd-app').evaluate((ytdApp) => {
    const content = document.createElement('div');
    content.id = 'content';

    const pageManager = document.createElement('ytd-page-manager');
    const search = document.createElement('ytd-search');
    const container = document.createElement('div');
    container.id = 'container';

    const twoColumn = document.createElement('ytd-two-column-search-results-renderer');
    const primary = document.createElement('div');
    primary.id = 'primary';

    const sectionList = document.createElement('ytd-section-list-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    const itemSection = document.createElement('ytd-item-section-renderer');
    const innerContents = document.createElement('div');
    innerContents.id = 'contents';

    innerContents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
      </div>
    </ytd-video-renderer>`;

    itemSection.appendChild(innerContents);
    contents.appendChild(itemSection);
    sectionList.appendChild(contents);
    primary.appendChild(sectionList);
    twoColumn.appendChild(primary);
    container.appendChild(twoColumn);
    search.appendChild(container);
    pageManager.appendChild(search);
    content.appendChild(pageManager);
    ytdApp.appendChild(content);
  });

  const video = page.locator('ytd-video-renderer');
  await expect(video).toBeVisible();
});
