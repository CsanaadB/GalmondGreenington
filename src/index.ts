import {
  filterVideos,
  observeNewVideos,
  parseWhitelist,
  waitForContents,
} from './filter';

(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  filterVideos(document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer'), whitelist);

  const container = document.querySelector('#contents');

  if (container) {
    observeNewVideos(container, whitelist);
  } else {
    const contents = await waitForContents();
    filterVideos(contents.querySelectorAll('ytd-rich-item-renderer'), whitelist);
    observeNewVideos(contents, whitelist);
  }
})();
