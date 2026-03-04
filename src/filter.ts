export function parseWhitelist(text: string): Set<string> {
  const listItems = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return new Set(listItems);
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
