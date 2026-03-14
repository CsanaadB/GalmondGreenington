import { test, expect } from 'vitest';
import { observeNewVideos, waitForContents } from '../../src/filter';

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

test('waitForContents calls back with the #contents element when it appears', async () => {
  const richGrid = document.createElement('ytd-rich-grid-renderer');
  const contents = document.createElement('div');
  contents.id = 'contents';
  richGrid.appendChild(contents);

  const contentsFound = waitForContents();

  document.body.appendChild(richGrid);

  const received = await contentsFound;

  expect(received).toBe(contents);
});
