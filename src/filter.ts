export function parseWhitelist(text: string): Set<string> {
  const listItems = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return new Set(listItems);
}

export function findContentsElement(nodes: Node[]): Element | undefined {
  return nodes
    .filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
    .find((element) => element.id === 'contents');
}

export function observeNewVideos(container: Element, whitelist: Set<string>): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const added = Array.from(mutation.addedNodes).filter(
        (node): node is Element => node.nodeName === 'YTD-RICH-ITEM-RENDERER'
      );

      filterVideos(added, whitelist);
    }
  });

  observer.observe(container, { childList: true });
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
