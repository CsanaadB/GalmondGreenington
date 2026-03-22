import { describe, it, expect } from 'vitest';
import { filterBrowseItems } from '../../src/intercept';

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
