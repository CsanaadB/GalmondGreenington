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

test('extension filters videos by whitelist on youtube homepage', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-homepage.html');
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
  }, videoTemplate('/@TheRealWalterWhiteOfficial1'));

  const injected = page.locator(
    'ytd-rich-item-renderer:has(a[href="/@TheRealWalterWhiteOfficial1"])'
  );
  await expect(injected).toHaveCount(3);
  const lastVideo = injected.last();
  await expect(lastVideo).toHaveAttribute('data-allowed', '');
  await expect(lastVideo).toBeVisible();

  await page.locator('#contents').evaluate((el, videoElement) => {
    el.insertAdjacentHTML('beforeend', videoElement);
  }, videoTemplate('/@SomeBlockedChannel'));

  const blockedVideo = page.locator(
    'ytd-rich-item-renderer:has(a[href="/@SomeBlockedChannel"])'
  );
  await expect(blockedVideo).toHaveCount(1);
  await expect(blockedVideo.first()).not.toHaveAttribute('data-allowed', '');
  await expect(blockedVideo.first()).not.toBeVisible();
});

test('extension filters homepage videos when #contents does not exist until after page load', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    richGrid.appendChild(contents);
    document.body.appendChild(richGrid);
  });

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@TheRealWalterWhiteOfficial1'));

  await expect(page.locator('ytd-rich-item-renderer')).toHaveAttribute('data-allowed', '');
});

test('extension filters infinite scroll videos after late-loading #contents', async ({ page }) => {
  await page.route('https://www.youtube.com/', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/');

  await page.evaluate(() => {
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    richGrid.appendChild(contents);
    document.body.appendChild(richGrid);
  });

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@TheRealWalterWhiteOfficial1'));

  await expect(page.locator('ytd-rich-item-renderer').first()).toHaveAttribute('data-allowed', '');

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@detectiveRust999'));

  const scrolledWhitelisted = page.locator('ytd-rich-item-renderer:has(a[href="/@detectiveRust999"])');
  await expect(scrolledWhitelisted).toHaveCount(1);
  await expect(scrolledWhitelisted.first()).toHaveAttribute('data-allowed', '');
  await expect(scrolledWhitelisted.first()).toBeVisible();

  await page.locator('#contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, videoTemplate('/@SomeBlockedChannel'));

  const scrolledBlocked = page.locator('ytd-rich-item-renderer:has(a[href="/@SomeBlockedChannel"])');
  await expect(scrolledBlocked).toHaveCount(1);
  await expect(scrolledBlocked.first()).not.toHaveAttribute('data-allowed', '');
  await expect(scrolledBlocked.first()).not.toBeVisible();
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
        <div id="contents">
          <ytd-item-section-renderer>
            <div id="contents"></div>
          </ytd-item-section-renderer>
        </div>
      </body></html>`,
      contentType: 'text/html',
    });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  await page.locator('ytd-item-section-renderer #contents').evaluate((el, videoHtml) => {
    el.insertAdjacentHTML('beforeend', videoHtml);
  }, `<ytd-video-renderer>
    <div id="channel-info">
      <a href="/@TheRealWalterWhiteOfficial1"></a>
    </div>
  </ytd-video-renderer>`);

  const injectedVideo = page.locator('ytd-video-renderer');
  await expect(injectedVideo).toHaveAttribute('data-allowed', '');
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
    const sectionList = document.createElement('ytd-section-list-renderer');
    const rightContents = document.createElement('div');
    rightContents.id = 'contents';

    rightContents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@TheRealWalterWhiteOfficial1"></a>
      </div>
    </ytd-video-renderer>`;

    sectionList.appendChild(rightContents);
    document.body.appendChild(sectionList);
  });

  const video = page.locator('ytd-video-renderer');
  await expect(video).toHaveAttribute('data-allowed', '');
});

test('extension filters search videos when #contents does not exist until after page load', async ({ page }) => {
  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: '<html><body></body></html>', contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  /* youtube inserts #contents with the initial batch of videos already inside,
     so videos must be present before appending to DOM */
  await page.evaluate(() => {
    const outerContents = document.createElement('div');
    outerContents.id = 'contents';

    const itemSectionRenderer = document.createElement('ytd-item-section-renderer');

    const innerContents = document.createElement('div');
    innerContents.id = 'contents';
    innerContents.innerHTML = `<ytd-video-renderer>
      <div id="channel-info">
        <a href="/@TheRealWalterWhiteOfficial1"></a>
      </div>
    </ytd-video-renderer>`;

    itemSectionRenderer.appendChild(innerContents);
    outerContents.appendChild(itemSectionRenderer);

    const sectionList = document.createElement('ytd-section-list-renderer');
    sectionList.appendChild(outerContents);
    document.body.appendChild(sectionList);
  });

  const injectedVideo = page.locator('ytd-video-renderer');
  await expect(injectedVideo).toHaveAttribute('data-allowed', '');
});

test('extension filters videos by whitelist on youtube search results', async ({ page }) => {
  const fixture = path.resolve('tests/e2e/fixtures/youtube-search.html');
  const html = await fs.readFile(fixture, 'utf-8');

  await page.route('https://www.youtube.com/results?search_query=test', async (route) => {
    await route.fulfill({ body: html, contentType: 'text/html' });
  });

  await page.goto('https://www.youtube.com/results?search_query=test');

  const whitelistedChannels = ['/@TheRealWalterWhiteOfficial1', '/@detectiveRust999'];

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

  const blockedChannelSelector = whitelistedChannels
    .map((channel) => `:not(:has(a[href="${channel}"]))`)
    .join('');
  const blockedVideos = page.locator(
    `ytd-video-renderer${blockedChannelSelector}`
  );
  await expect(blockedVideos).toHaveCount(2);
  for (const video of await blockedVideos.all()) {
    await expect(video).not.toBeVisible();
  }
});
