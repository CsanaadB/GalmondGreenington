import {
  filterVideos,
  observeNewVideos,
  parseWhitelist,
  waitForElement,
} from './filter';

(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  filterVideos(document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer'), whitelist);

  const ytdApp = await waitForElement(document.body, 'ytd-app');
  const contents = await waitForElement(ytdApp, 'ytd-section-list-renderer > #contents, ytd-rich-grid-renderer > #contents');
  filterVideos(contents.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer'), whitelist);
  observeNewVideos(contents, whitelist);
})();
