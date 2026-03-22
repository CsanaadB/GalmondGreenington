import { describe, it, expect } from 'vitest';
import { filterBrowseItems, filterSearchItems } from '../../src/intercept';

describe('filterBrowseItems', () => {
  it('keeps only whitelisted items', () => {
    const whitelistedItem = {
      richItemRenderer: {
        content: {
          lockupViewModel: {
            contentId: 'vid-1',
            metadata: { lockupMetadataViewModel: { metadata: { contentMetadataViewModel: {
              metadataRows: [{ metadataParts: [{ text: { commandRuns: [{ onTap: { innertubeCommand: {
                browseEndpoint: { canonicalBaseUrl: '/@whitelistedChannel' }
              } } }] } }] }]
            } } } }
          }
        }
      }
    };
    const blockedItem = {
      richItemRenderer: {
        content: {
          lockupViewModel: {
            contentId: 'vid-2',
            metadata: { lockupMetadataViewModel: { metadata: { contentMetadataViewModel: {
              metadataRows: [{ metadataParts: [{ text: { commandRuns: [{ onTap: { innertubeCommand: {
                browseEndpoint: { canonicalBaseUrl: '/@blockedChannel' }
              } } }] } }] }]
            } } } }
          }
        }
      }
    };
    const whitelist = new Set(['/@whitelistedChannel']);
    const filtered = filterBrowseItems([whitelistedItem, blockedItem], whitelist);
    expect(filtered).toEqual([whitelistedItem]);
  });
});

describe('filterSearchItems', () => {
  it('keeps only whitelisted items', () => {
    const whitelistedItem = {
      videoRenderer: {
        videoId: 'vid-1',
        longBylineText: { runs: [{ navigationEndpoint: { commandMetadata: {
          webCommandMetadata: { url: '/@whitelistedChannel' }
        } } }] }
      }
    };
    const blockedItem = {
      videoRenderer: {
        videoId: 'vid-2',
        longBylineText: { runs: [{ navigationEndpoint: { commandMetadata: {
          webCommandMetadata: { url: '/@blockedChannel' }
        } } }] }
      }
    };
    const whitelist = new Set(['/@whitelistedChannel']);
    const filtered = filterSearchItems([whitelistedItem, blockedItem], whitelist);
    expect(filtered).toEqual([whitelistedItem]);
  });
});
