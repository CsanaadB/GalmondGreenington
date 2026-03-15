import { test, expect } from 'vitest';
import {
  findContentsElement,
  observeNewVideos,
  waitForElement,
} from '../../src/filter';

test('observeNewVideos filters whitelisted videos added to the container', async () => {
  const video = document.createElement('ytd-rich-item-renderer');
  const link = document.createElement('a');

  link.setAttribute('href', '/@whitelisted-channel');
  video.appendChild(link);

  const whitelist = new Set(['/@whitelisted-channel']);
  const container = document.createElement('div');
  observeNewVideos(container, whitelist);

  container.appendChild(video);
  await Promise.resolve();

  expect(video.hasAttribute('data-allowed')).toBe(true);
});

test('observeNewVideos does not mark non-whitelisted videos', async () => {
  const video = document.createElement('ytd-rich-item-renderer');
  const whitelist = new Set(['/@whitelisted-channel']);
  const container = document.createElement('div');

  observeNewVideos(container, whitelist);

  container.appendChild(video);
  await Promise.resolve();

  expect(video.hasAttribute('data-allowed')).toBe(false);
});

test('observeNewVideos ignores non-video elements', async () => {
  const nonVideo = document.createElement('div');
  const link = document.createElement('a');

  link.setAttribute('href', '/@whitelisted-channel');
  nonVideo.appendChild(link);

  const whitelist = new Set(['/@whitelisted-channel']);
  const container = document.createElement('div');
  observeNewVideos(container, whitelist);

  container.appendChild(nonVideo);
  await Promise.resolve();

  expect(nonVideo.hasAttribute('data-allowed')).toBe(false);
});

test('waitForElement resolves immediately when the element already exists', async () => {
  const ytdApp = document.createElement('ytd-app');
  document.body.appendChild(ytdApp);

  const foundApp = await waitForElement(document.body, 'ytd-app');
  expect(foundApp).toBe(ytdApp);

  ytdApp.remove();
});

test('waitForElement catches ytd-app, then findContentsElement finds #contents inside it', async () => {
  const ytdApp = document.createElement('ytd-app');
  const richGrid = document.createElement('ytd-rich-grid-renderer');
  const contentsDiv = document.createElement('div');
  contentsDiv.id = 'contents';

  richGrid.appendChild(contentsDiv);
  ytdApp.appendChild(richGrid);

  const elementFoundPromise = waitForElement(document.body, 'ytd-app');

  document.body.appendChild(ytdApp);

  const foundApp = await elementFoundPromise;
  expect(foundApp).toBe(ytdApp);

  const foundContents = findContentsElement(foundApp);
  expect(foundContents).toBe(contentsDiv);
});
