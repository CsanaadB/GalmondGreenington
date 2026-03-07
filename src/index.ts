import {
  filterVideos,
  findContentsElement,
  observeNewVideos,
  parseWhitelist,
} from './filter';

(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  filterVideos(document.querySelectorAll('ytd-rich-item-renderer'), whitelist);

  const container = document.querySelector('#contents');

  if (container) {
    observeNewVideos(container, whitelist);
  } else {
    const contentsLoadObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const contents = findContentsElement(Array.from(mutation.addedNodes));

        if (contents) {
          contentsLoadObserver.disconnect();
          filterVideos(contents.querySelectorAll('ytd-rich-item-renderer'), whitelist);
          observeNewVideos(contents, whitelist);
        }
      }
    });

    contentsLoadObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
