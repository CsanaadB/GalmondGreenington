interface BrowseAction {
  appendContinuationItemsAction?: {
    continuationItems: unknown[];
  };
}

import { parseWhitelist } from './filter';

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

    if (!url.includes('/youtubei/v1/browse')) {
      return response;
    }

    const data = await response.json();

    if (data.onResponseReceivedActions && whitelist) {
      data.onResponseReceivedActions
        .forEach((action: BrowseAction) => {
          if (action.appendContinuationItemsAction) {
            action.appendContinuationItemsAction.continuationItems =
              filterBrowseItems(action.appendContinuationItemsAction.continuationItems, whitelist);
          }
        });
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHandleFromLockupViewModel(lvm: any): string | null {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterBrowseItems(items: any[], whitelist: Set<string>): any[] {
  return items.filter((item) => {
    if (!item.richItemRenderer) { return true; }
    if (!item.richItemRenderer.content) { return true; }
    if (!item.richItemRenderer.content.lockupViewModel) { return true; }

    const handle = getHandleFromLockupViewModel(item.richItemRenderer.content.lockupViewModel);
    return handle !== null && whitelist.has(handle);
  });
}
