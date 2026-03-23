type ChannelsInitialData = {
  contents: {
    twoColumnBrowseResultsRenderer: {
      tabs: Array<{
        tabRenderer: {
          content: {
            sectionListRenderer: {
              contents: Array<{
                itemSectionRenderer: {
                  contents: Array<{
                    shelfRenderer: {
                      content: {
                        expandedShelfContentsRenderer: {
                          items: Array<{
                            channelRenderer: {
                              navigationEndpoint: {
                                browseEndpoint: {
                                  canonicalBaseUrl: string
                                }
                              }
                            }
                          }>
                        }
                      }
                    }
                  }>
                }
              }>
            }
          }
        }
      }>
    }
  }
}

export function extractSubscriptions(ytInitialData: ChannelsInitialData): string[] {
  const items = ytInitialData
    .contents.twoColumnBrowseResultsRenderer
    .tabs[0].tabRenderer.content.sectionListRenderer
    .contents[0].itemSectionRenderer
    .contents[0].shelfRenderer.content.expandedShelfContentsRenderer
    .items;

  return items.map(
    (item) => item.channelRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl
  );
}
