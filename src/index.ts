import { filterVideos, parseWhitelist } from './filter';

(async (): Promise<void> => {
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const whitelist = parseWhitelist(await response.text());

  const items = document.querySelectorAll('ytd-rich-item-renderer');
  filterVideos(items, whitelist);

  const container = document.querySelector('#contents');

  if (container) {
    const infiniteScrollObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const added = Array.from(mutation.addedNodes).filter(
          (node): node is Element => node.nodeName === 'YTD-RICH-ITEM-RENDERER'
        );

        filterVideos(added, whitelist);
      }
    });

    infiniteScrollObserver.observe(container, { childList: true });
  } else {
    const contentsLoadObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const contents = Array.from(mutation.addedNodes)
          .filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
          .find((element) => element.id === 'contents');

        if (contents) {
          contentsLoadObserver.disconnect();
          filterVideos(contents.querySelectorAll('ytd-rich-item-renderer'), whitelist);

          const infiniteScrollObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              const added = Array.from(mutation.addedNodes).filter(
                (node): node is Element => node.nodeName === 'YTD-RICH-ITEM-RENDERER'
              );

              filterVideos(added, whitelist);
            }
          });

          infiniteScrollObserver.observe(contents, { childList: true });
        }
      }
    });

    contentsLoadObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
