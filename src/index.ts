import {
  VIDEO_SELECTOR,
  filterVideos,
  observeNewVideos,
  parseWhitelist,
  waitForElement,
} from './filter';

(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  filterVideos(document.querySelectorAll(VIDEO_SELECTOR), whitelist);

  const ytdApp = await waitForElement(document.body, 'ytd-app');
  const contents = await waitForElement(ytdApp, 'ytd-section-list-renderer > #contents, ytd-rich-grid-renderer > #contents');
  filterVideos(contents.querySelectorAll(VIDEO_SELECTOR), whitelist);
  let videoObserver = observeNewVideos(contents, whitelist);

  document.addEventListener('yt-navigate-finish', () => {
    videoObserver.disconnect();

    filterVideos(document.querySelectorAll(VIDEO_SELECTOR), whitelist);

    videoObserver = observeNewVideos(ytdApp, whitelist);
  });
})();
