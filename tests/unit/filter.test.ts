import { describe, it, expect } from 'vitest';
import {
  filterVideos,
  findContentsElement,
  parseWhitelist,
} from '../../src/filter';

describe('filterVideos', () => {
  it('sets data-allowed on whitelisted item', () => {
    const item = document.createElement('ytd-rich-item-renderer');
    const link = document.createElement('a');
    link.setAttribute('href', '/@TheRealWalterWhiteOfficial1');
    item.appendChild(link);
    filterVideos([item], new Set(['/@TheRealWalterWhiteOfficial1']));
    expect(item.hasAttribute('data-allowed')).toBe(true);
  });

  it('skips items without a channel link', () => {
    const item = document.createElement('ytd-rich-item-renderer');
    expect(() => filterVideos([item], new Set())).not.toThrow();
  });
});

describe('findContentsElement', () => {
  it('returns the #contents element from a list of nodes', () => {
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';
    richGrid.appendChild(contents);

    expect(findContentsElement(richGrid)).toBe(contents);
  });

  it('finds #contents inside a nested renderer', () => {
    const root = document.createElement('div');
    const richGrid = document.createElement('ytd-rich-grid-renderer');
    const contents = document.createElement('div');
    contents.id = 'contents';

    richGrid.appendChild(contents);
    root.appendChild(richGrid);

    expect(findContentsElement(root)).toBe(contents);
  });

  it('returns null when #contents is not in the list', () => {
    const other = document.createElement('div');
    other.id = 'something-else';

    expect(findContentsElement(other)).toBeNull();
  });

  it('ignores non-element nodes', () => {
    const fragment = document.createDocumentFragment();
    (fragment as any).id = 'contents';

    expect(findContentsElement(fragment)).toBeNull();
  });
});

describe('parseWhitelist', () => {
  it('parses lines into a Set, ignoring blank lines and whitespace', () => {
    const text = '/@ChannelOne\n  \n/@ChannelTwo\n\n  /@ChannelThree  \n';
    const result = parseWhitelist(text);
    expect(result).toEqual(new Set(['/@ChannelOne', '/@ChannelTwo', '/@ChannelThree']));
  });
});
