(async (): Promise<void> => {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const response = await fetch(chrome.runtime.getURL('whitelist.txt'));
  const text = await response.text();
  window.postMessage({ type: 'greenington-whitelist', text: text }, '*');
})();
