import { expect } from '@playwright/test';
import { test } from './fixtures/extension';
import path from 'path';
import fs from 'fs/promises';

test('extension filters videos by whitelist on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-homepage.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  const whitelistedChannels = ['/@WhitelistedChannel1', '/@WhitelistedChannel2'];

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

  const nonWhitelistedChannelSelector = whitelistedChannels
    .map((channel) => `:not(:has(a[href="${channel}"]))`)
    .join('');
  const nonWhitelistedVideos = page.locator(
    `ytd-rich-item-renderer${nonWhitelistedChannelSelector}`
  );
  await expect(nonWhitelistedVideos).toHaveCount(2);
  for (const video of await nonWhitelistedVideos.all()) {
    await expect(video).not.toBeVisible();
  }
});

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

test('extension filters dynamically added videos by whitelist', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-homepage.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.locator('#contents').evaluate((el, videoElement) => {
    el.insertAdjacentHTML('beforeend', videoElement);
  }, videoTemplate('/@InjectedWhitelistedChannel1'));

  const injected = page.locator(
    'ytd-rich-item-renderer:has(a[href="/@InjectedWhitelistedChannel1"])'
  );
  await expect(injected).toHaveCount(3);
  const lastVideo = injected.last();
  await expect(lastVideo).toHaveAttribute('data-allowed', '');
  await expect(lastVideo).toBeVisible();

  await page.locator('#contents').evaluate((el, videoElement) => {
    el.insertAdjacentHTML('beforeend', videoElement);
  }, videoTemplate('/@InjectedNonWhitelistedChannel1'));

  const injectedNonWhitelisted = page.locator(
    'ytd-rich-item-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])'
  );
  await expect(injectedNonWhitelisted).toHaveCount(1);
  await expect(injectedNonWhitelisted.first()).not.toHaveAttribute('data-allowed', '');
  await expect(injectedNonWhitelisted.first()).not.toBeVisible();
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

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedWhitelistedChannel1'));

  await expect(page.locator('ytd-rich-item-renderer').first()).toHaveAttribute('data-allowed', '');

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedWhitelistedChannel2'));

  const scrolledWhitelisted = page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedWhitelistedChannel2"])');
  await expect(scrolledWhitelisted).toHaveCount(1);
  await expect(scrolledWhitelisted.first()).toHaveAttribute('data-allowed', '');
  await expect(scrolledWhitelisted.first()).toBeVisible();

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@InjectedNonWhitelistedChannel1'));

  const scrolledNonWhitelisted = page.locator('ytd-rich-item-renderer:has(a[href="/@InjectedNonWhitelistedChannel1"])');
  await expect(scrolledNonWhitelisted).toHaveCount(1);
  await expect(scrolledNonWhitelisted.first()).not.toHaveAttribute('data-allowed', '');
  await expect(scrolledNonWhitelisted.first()).not.toBeVisible();
});

test('extension filters empty shell videos once they get populated', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const ytdApp = document.createElement('ytd-app');
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    const shell = document.createElement('ytd-rich-item-renderer');
    contents.appendChild(shell);

    richGrid.appendChild(contents);
    ytdApp.appendChild(richGrid);
    document.body.appendChild(ytdApp);
  });

  const videoShell = page.locator('ytd-rich-item-renderer');
  await expect(videoShell).not.toHaveAttribute('data-allowed');

  await videoShell.evaluate((el) => {
    el.innerHTML = `<div id="content">
      <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
    </div>`;

    document.dispatchEvent(new CustomEvent('yt-renderidom-finished', { bubbles: true }));
  });

  await expect(videoShell).toHaveAttribute('data-allowed', '');
});

test('extension hides all search result videos', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-search.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  const video = page.locator('ytd-video-renderer').first();
  await expect(video).not.toBeVisible();
});

test('extension filters dynamically added videos on search results', async ({ page }) => {
  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({
      body: `<html><body>
        <ytd-app>
          <ytd-section-list-renderer>
            <div id="contents">
              <ytd-item-section-renderer>
                <div id="contents"></div>
              </ytd-item-section-renderer>
            </div>
          </ytd-section-list-renderer>
        </ytd-app>
      </body></html>`,
      contentType: 'text/html',
    });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  await page.locator('ytd-item-section-renderer #contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, `<ytd-video-renderer>
    <div id="channel-info">
      <a href="/@InjectedWhitelistedChannel1">Injected Whitelisted Channel 1</a>
    </div>
  </ytd-video-renderer>`);

  const injectedVideo = page.locator('ytd-video-renderer');
  await expect(injectedVideo).toHaveAttribute('data-allowed', '');
  await expect(injectedVideo).toBeVisible();
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

  const video = page.locator('ytd-video-renderer');
  await expect(video).toHaveAttribute('data-allowed', '');
  await expect(video).toBeVisible();
});


test('extension filters videos by whitelist on youtube search results', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-search.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  const whitelistedChannels = ['/@WhitelistedChannel1', '/@WhitelistedChannel2'];

  for (const channel of whitelistedChannels) {
    const videos = page.locator(
      `ytd-video-renderer:has(a[href="${channel}"])`
    );
    expect(await videos.count()).toBeGreaterThan(0);
    for (const video of await videos.all()) {
      await expect(video).toHaveAttribute('data-allowed', '');
      await expect(video).toBeVisible();
    }
  }

  const nonWhitelistedChannelSelector = whitelistedChannels
    .map((channel) => `:not(:has(a[href="${channel}"]))`)
    .join('');
  const nonWhitelistedVideos = page.locator(
    `ytd-video-renderer${nonWhitelistedChannelSelector}`
  );
  await expect(nonWhitelistedVideos).toHaveCount(2);
  for (const video of await nonWhitelistedVideos.all()) {
    await expect(video).not.toBeVisible();
  }
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

  const searchVideo = page.locator(
    'ytd-video-renderer:has(a[href="/@InjectedWhitelistedChannel1"])'
  );
  await expect(searchVideo).toHaveAttribute('data-allowed', '');

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
  await expect(scrolledVideo).toHaveAttribute('data-allowed', '');

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
  await expect(nonWhitelistedVideo).not.toHaveAttribute('data-allowed');
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
  await expect(videoAfterSecondNav).toHaveAttribute('data-allowed', '');
});

test('extension filters search videos when DOM is built dynamically inside ytd-app', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-shell.html');
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
  await expect(video).toHaveAttribute('data-allowed', '');
  await expect(video).toBeVisible();
});
