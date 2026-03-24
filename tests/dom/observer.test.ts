import { test, expect } from 'vitest';
import {
  observeNewVideos,
  waitForElement,
  watchForContentSwap,
} from '../../src/filter';

test('observeNewVideos filters whitelisted videos added to the container', async () => {
  const video = document.createElement('ytd-rich-item-renderer');
  const link = document.createElement('a');

  link.setAttribute('href', '/@WhitelistedChannel1');
  video.appendChild(link);

  const whitelist = new Set(['/@WhitelistedChannel1']);
  const container = document.createElement('div');
  observeNewVideos(container, whitelist);

  container.appendChild(video);
  await Promise.resolve();

  expect(video.hasAttribute('data-allowed')).toBe(true);
});

test('observeNewVideos does not mark non-whitelisted videos', async () => {
  const video = document.createElement('ytd-rich-item-renderer');
  const whitelist = new Set(['/@WhitelistedChannel1']);
  const container = document.createElement('div');

  observeNewVideos(container, whitelist);

  container.appendChild(video);
  await Promise.resolve();

  expect(video.hasAttribute('data-allowed')).toBe(false);
});

test('observeNewVideos ignores non-video elements', async () => {
  const nonVideo = document.createElement('div');
  const link = document.createElement('a');

  link.setAttribute('href', '/@WhitelistedChannel1');
  nonVideo.appendChild(link);

  const whitelist = new Set(['/@WhitelistedChannel1']);
  const container = document.createElement('div');
  observeNewVideos(container, whitelist);

  container.appendChild(nonVideo);
  await Promise.resolve();

  expect(nonVideo.hasAttribute('data-allowed')).toBe(false);
});

test('watchForContentSwap removes data-allowed when channel link changes', async () => {
  const video = document.createElement('ytd-rich-item-renderer');
  const link = document.createElement('a');
  link.setAttribute('href', '/@WhitelistedChannel1');
  video.appendChild(link);
  video.toggleAttribute('data-allowed', true);

  const whitelist = new Set(['/@WhitelistedChannel1']);
  watchForContentSwap(video, '/@WhitelistedChannel1', whitelist);

  link.setAttribute('href', '/@NonWhitelistedChannel1');
  await Promise.resolve();

  expect(video.hasAttribute('data-allowed')).toBe(false);
});

test('waitForElement resolves immediately when the element already exists', async () => {
  const ytdApp = document.createElement('ytd-app');
  document.body.appendChild(ytdApp);

  const foundApp = await waitForElement(document.body, 'ytd-app');
  expect(foundApp).toBe(ytdApp);

  ytdApp.remove();
});

test('waitForElement resolves when matching element is added as a deep descendant', async () => {
  const parent = document.createElement('div');
  const child = document.createElement('div');
  document.body.appendChild(parent);
  parent.appendChild(child);

  const elementFound = waitForElement(parent, 'span');

  const grandchild = document.createElement('span');
  child.appendChild(grandchild);

  const foundElement = await elementFound;
  expect(foundElement).toBe(grandchild);

  parent.remove();
});
