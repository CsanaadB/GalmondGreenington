import { describe, it, expect } from 'vitest';
import {
  filterVideos,
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

  it('does not set data-allowed on non-whitelisted item', () => {
    const item = document.createElement('ytd-rich-item-renderer');
    const link = document.createElement('a');

    link.setAttribute('href', '/@NotOnTheList');
    item.appendChild(link);

    filterVideos([item], new Set(['/@SomeOtherChannel']));

    expect(item.hasAttribute('data-allowed')).toBe(false);
  });

  it('removes data-allowed from non-whitelisted item that previously had it', () => {
    const item = document.createElement('ytd-rich-item-renderer');
    const link = document.createElement('a');
    link.setAttribute('href', '/@NotOnTheList');
    item.appendChild(link);
    item.toggleAttribute('data-allowed', true);

    filterVideos([item], new Set(['/@SomeOtherChannel']));

    expect(item.hasAttribute('data-allowed')).toBe(false);
  });

  it('skips items without a channel link', () => {
    const item = document.createElement('ytd-rich-item-renderer');
    expect(() => filterVideos([item], new Set())).not.toThrow();
  });
});


describe('parseWhitelist', () => {
  it('parses lines into a Set, ignoring blank lines and whitespace', () => {
    const text = '/@ChannelOne\n  \n/@ChannelTwo\n\n  /@ChannelThree  \n';
    const result = parseWhitelist(text);
    expect(result).toEqual(new Set(['/@ChannelOne', '/@ChannelTwo', '/@ChannelThree']));
  });
});
