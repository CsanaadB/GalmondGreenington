export const VIDEO_TAGS = ['ytd-rich-item-renderer', 'ytd-video-renderer'];
export const VIDEO_SELECTOR = VIDEO_TAGS.join(', ');

export function parseWhitelist(text: string): Set<string> {
  const listItems = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return new Set(listItems);
}


export function waitForElement(parent: Element, selector: string): Promise<Element> {
  return new Promise((resolve) => {
    const existing = parent.querySelector(selector);

    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = parent.querySelector(selector);

      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(parent, { childList: true, subtree: true });
  });
}

export function observeNewVideos(container: Element, whitelist: Set<string>): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const added = Array.from(mutation.addedNodes).filter(
        (node): node is Element => VIDEO_TAGS.includes(node.nodeName.toLowerCase())
      );

      if (added.length > 0) {
        filterVideos(added, whitelist);
      }
    }
  });

  observer.observe(container, { childList: true, subtree: true });

  return observer;
}

export function filterVideos(items: Iterable<Element>, whitelist: Set<string>): void {
  for (const item of items) {
    const link = item.querySelector('a[href^="/@"]');

    if (!link) {
      continue;
    }

    const href = link.getAttribute('href');

    if (href && whitelist.has(href)) {
      item.toggleAttribute('data-allowed', true);
    }
  }
}
