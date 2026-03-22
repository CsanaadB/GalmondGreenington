import { parseWhitelist } from './filter';

interface BrowseResponse {
  onResponseReceivedActions: Array<{
    appendContinuationItemsAction?: {
      continuationItems: BrowseItem[];
    };
  }>;
}

interface SearchResponse {
  contents: {
    twoColumnSearchResultsRenderer: {
      primaryContents: {
        sectionListRenderer: {
          contents: Array<{
            itemSectionRenderer?: {
              contents: SearchItem[];
            };
          }>;
        };
      };
    };
  };
}

export interface MetadataPart {
  text: {
    commandRuns: Array<{
      onTap: {
        innertubeCommand: {
          browseEndpoint: {
            canonicalBaseUrl: string;
          };
        };
      };
    }>;
  };
}

export interface LockupViewModel {
  contentId: string;
  metadata: {
    lockupMetadataViewModel: {
      metadata: {
        contentMetadataViewModel: {
          metadataRows: Array<{
            metadataParts: MetadataPart[];
          }>;
        };
      };
    };
  };
}

export interface BrowseItem {
  richItemRenderer?: {
    content: {
      lockupViewModel?: LockupViewModel;
    };
  };
}

export interface VideoRenderer {
  videoId: string;
  longBylineText: {
    runs: Array<{
      navigationEndpoint: {
        commandMetadata: {
          webCommandMetadata: {
            url: string;
          };
        };
      };
    }>;
  };
}

export interface SearchItem {
  videoRenderer?: VideoRenderer;
}

export function isBrowseResponse(data: unknown): data is BrowseResponse {
  return typeof data === 'object' && data !== null
    && 'onResponseReceivedActions' in data;
}

export function isSearchResponse(data: unknown): data is SearchResponse {
  return typeof data === 'object' && data !== null
    && 'contents' in data;
}

let whitelist: Set<string> | null = null;

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'greenington-whitelist') {
    whitelist = parseWhitelist(event.data.text);
  }
});

window.fetch = new Proxy(window.fetch, {
  async apply(target, thisArg, args) {
    const response = await Reflect.apply(target, thisArg, args);

    if (!(response instanceof Response)) {
      throw new Error('fetch did not return a Response');
    }

    const url = (args[0] instanceof Request) ? args[0].url : String(args[0]);

    const isBrowse = url.includes('/youtubei/v1/browse');
    const isSearch = url.includes('/youtubei/v1/search');

    if (!isBrowse && !isSearch) {
      return response;
    }

    const data = await response.json();

    if (!whitelist) {
      return response;
    }

    if (isBrowse && isBrowseResponse(data)) {
      for (const action of data.onResponseReceivedActions) {
        if (action.appendContinuationItemsAction) {
          action.appendContinuationItemsAction.continuationItems =
            filterBrowseItems(action.appendContinuationItemsAction.continuationItems, whitelist);
        }
      }
    }

    if (isSearch && isSearchResponse(data)) {
      const sections = data.contents.twoColumnSearchResultsRenderer
        .primaryContents.sectionListRenderer.contents;

      for (const section of sections) {
        if (section.itemSectionRenderer) {
          section.itemSectionRenderer.contents =
            filterSearchItems(section.itemSectionRenderer.contents, whitelist);
        }
      }
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
});

function getHandleFromLockupViewModel(lvm: LockupViewModel): string | null {
  try {
    return lvm.metadata.lockupMetadataViewModel
      .metadata.contentMetadataViewModel
      .metadataRows[0].metadataParts[0]
      .text.commandRuns[0].onTap.innertubeCommand
      .browseEndpoint.canonicalBaseUrl;
  } catch {
    return null;
  }
}

function getHandleFromVideoRenderer(vr: VideoRenderer): string | null {
  try {
    return vr.longBylineText.runs[0].navigationEndpoint
      .commandMetadata.webCommandMetadata.url;
  } catch {
    return null;
  }
}

export function filterSearchItems(items: SearchItem[], whitelist: Set<string>): SearchItem[] {
  return items.filter((item) => {
    if (!item.videoRenderer) { return true; }

    const handle = getHandleFromVideoRenderer(item.videoRenderer);
    return handle !== null && whitelist.has(handle);
  });
}

export function filterBrowseItems(items: BrowseItem[], whitelist: Set<string>): BrowseItem[] {
  return items.filter((item) => {
    if (!item.richItemRenderer) { return true; }
    if (!item.richItemRenderer.content) { return true; }
    if (!item.richItemRenderer.content.lockupViewModel) { return true; }

    const handle = getHandleFromLockupViewModel(item.richItemRenderer.content.lockupViewModel);
    return handle !== null && whitelist.has(handle);
  });
}
