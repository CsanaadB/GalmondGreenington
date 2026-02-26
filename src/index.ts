const items = document.querySelectorAll('ytd-rich-item-renderer');

for (const item of items) {
  const link = item.querySelector('a[href^="/@"]');
  if (link && link.getAttribute('href') === '/@TheRealWalterWhiteOfficial1') {
    item.setAttribute('data-allowed', '');
  }
}
