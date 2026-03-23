import { describe, it, expect } from 'vitest';
import { extractSubscriptions } from '../../src/subscriptions';

const ytInitialDataFixture = {
  contents: {
    twoColumnBrowseResultsRenderer: {
      tabs: [{
        tabRenderer: {
          content: {
            sectionListRenderer: {
              contents: [{
                itemSectionRenderer: {
                  contents: [{
                    shelfRenderer: {
                      content: {
                        expandedShelfContentsRenderer: {
                          items: [
                            {
                              channelRenderer: {
                                navigationEndpoint: {
                                  browseEndpoint: {
                                    canonicalBaseUrl: '/@mitocw'
                                  }
                                }
                              }
                            },
                            {
                              channelRenderer: {
                                navigationEndpoint: {
                                  browseEndpoint: {
                                    canonicalBaseUrl: '/@Vsauce'
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }]
                }
              }]
            }
          }
        }
      }]
    }
  }
};

describe('extractSubscriptions', () => {
  it('extracts channel handles from ytInitialData', () => {
    const handles = extractSubscriptions(ytInitialDataFixture);

    expect(handles).toEqual(['/@mitocw', '/@Vsauce']);
  });
});
