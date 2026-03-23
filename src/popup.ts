async function onToggleClick(): Promise<void> {
  // @ts-expect-error chrome is provided by the browser extension runtime
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    throw new Error('no active tab found');
  }
  // @ts-expect-error chrome is provided by the browser extension runtime
  await chrome.tabs.sendMessage(tab.id, { type: 'toggle-filtering' });
}

const button = document.getElementById('toggle-whitelisting');
if (!button) {
  throw new Error('toggle-whitelisting button not found');
}

button.addEventListener('click', onToggleClick);
