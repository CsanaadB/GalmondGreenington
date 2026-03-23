import {
  VIDEO_SELECTOR,
  filterVideos,
  observeNewVideos,
  parseWhitelist,
  toggleFiltering,
  waitForElement,
} from './filter';

(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  const ytdApp = await waitForElement(document.body, 'ytd-app');
  const contents = await waitForElement(ytdApp, 'ytd-section-list-renderer > #contents, ytd-rich-grid-renderer > #contents');
  filterVideos(contents.querySelectorAll(VIDEO_SELECTOR), whitelist);
  let videoObserver = observeNewVideos(contents, whitelist);

  let videoPlaceholders = Array.from(
    contents.querySelectorAll(`${VIDEO_SELECTOR}:not(:has(a[href^="/@"]))`)
  );

  const onRenderidomFinished = (): void => {
    filterVideos(videoPlaceholders, whitelist);

    const allPlaceholdersPopulated = videoPlaceholders.every(
      (el) => el.querySelector('a[href^="/@"]')
    );

    if (allPlaceholdersPopulated) {
      document.removeEventListener('yt-renderidom-finished', onRenderidomFinished);
    }
  };

  // TODO: remove timeout once Shorts/ads are excluded from placeholders
  const PLACEHOLDER_TIMEOUT_MS = 30_000;

  if (videoPlaceholders.length > 0) {
    document.addEventListener('yt-renderidom-finished', onRenderidomFinished);

    setTimeout(() => {
      document.removeEventListener('yt-renderidom-finished', onRenderidomFinished);
    }, PLACEHOLDER_TIMEOUT_MS);
  }

  // @ts-expect-error chrome is provided by the browser extension runtime
  chrome.runtime.onMessage.addListener((message: { type: string }) => {
    if (message.type === 'toggle-filtering') {
      toggleFiltering(document);
    }
  });

  document.addEventListener('yt-navigate-finish', () => {
    videoObserver.disconnect();

    filterVideos(document.querySelectorAll(VIDEO_SELECTOR), whitelist);

    videoObserver = observeNewVideos(ytdApp, whitelist);
  });
})();
