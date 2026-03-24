import { describe, it, expect } from 'vitest';
import {
  filterBrowseItems,
  filterSearchItems,
  isBrowseResponse,
  isSearchResponse,
  type BrowseItem,
  type LockupViewModel,
  type SearchItem,
} from '../../src/intercept';

function lockupMetadata(handle: string): LockupViewModel['metadata'] {
  return {
    lockupMetadataViewModel: {
      metadata: {
        contentMetadataViewModel: {
          metadataRows: [{
            metadataParts: [{
              text: {
                commandRuns: [{
                  onTap: {
                    innertubeCommand: {
                      browseEndpoint: {
                        canonicalBaseUrl: handle 
                      }
                    }
                  }
                }]
              }
            }]
          }]
        }
      }
    }
  };
}

describe('filterBrowseItems', () => {
  it('keeps only whitelisted items', () => {
    const whitelistedItem: BrowseItem = {
      richItemRenderer: {
        content: {
          lockupViewModel: {
            contentId: 'vid-1',
            metadata: lockupMetadata('/@WhitelistedChannel1')
          }
        }
      }
    };
    const nonWhitelistedItem: BrowseItem = {
      richItemRenderer: {
        content: {
          lockupViewModel: {
            contentId: 'vid-2',
            metadata: lockupMetadata('/@NonWhitelistedChannel1')
          }
        }
      }
    };
    const whitelist = new Set(['/@WhitelistedChannel1']);
    const filtered = filterBrowseItems([whitelistedItem, nonWhitelistedItem], whitelist);
    expect(filtered).toEqual([whitelistedItem]);
  });

  it('passes through items without richItemRenderer', () => {
    const nonVideoItem: BrowseItem = {};
    const whitelist = new Set(['/@NonWhitelistedChannel2']);
    const filtered = filterBrowseItems([nonVideoItem], whitelist);
    expect(filtered).toEqual([nonVideoItem]);
  });
});

describe('filterSearchItems', () => {
  it('keeps only whitelisted items', () => {
    const whitelistedItem: SearchItem = {
      videoRenderer: {
        videoId: 'vid-1',
        longBylineText: { runs: [{ navigationEndpoint: { commandMetadata: {
          webCommandMetadata: { url: '/@WhitelistedChannel1' }
        } } }] }
      }
    };
    const nonWhitelistedItem: SearchItem = {
      videoRenderer: {
        videoId: 'vid-2',
        longBylineText: { runs: [{ navigationEndpoint: { commandMetadata: {
          webCommandMetadata: { url: '/@NonWhitelistedChannel1' }
        } } }] }
      }
    };
    const whitelist = new Set(['/@WhitelistedChannel1']);
    const filtered = filterSearchItems([whitelistedItem, nonWhitelistedItem], whitelist);
    expect(filtered).toEqual([whitelistedItem]);
  });

  it('passes through items without videoRenderer', () => {
    const nonVideoItem: SearchItem = {};
    const whitelist = new Set(['/@NonWhitelistedChannel2']);
    const filtered = filterSearchItems([nonVideoItem], whitelist);
    expect(filtered).toEqual([nonVideoItem]);
  });
});

describe('isBrowseResponse', () => {
  it('returns true for data with onResponseReceivedActions', () => {
    expect(isBrowseResponse({ onResponseReceivedActions: [] })).toBe(true);
  });

  it('returns false for data without onResponseReceivedActions', () => {
    expect(isBrowseResponse({ contents: {} })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isBrowseResponse(null)).toBe(false);
  });
});

describe('isSearchResponse', () => {
  it('returns true for data with contents', () => {
    expect(isSearchResponse({ contents: {} })).toBe(true);
  });

  it('returns false for data without contents', () => {
    expect(isSearchResponse({ onResponseReceivedActions: [] })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSearchResponse(null)).toBe(false);
  });
});
