import { test, expect } from 'vitest';
import { observeNewVideos } from '../../src/filter';

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
