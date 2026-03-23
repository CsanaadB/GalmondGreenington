import { describe, it, expect, beforeEach } from 'vitest';
import { toggleFiltering } from '../../src/filter';

describe('toggleFiltering', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('whitelisting-disabled');
  });

  it('adds whitelisting-disabled class to documentElement', () => {
    toggleFiltering(document);

    expect(document.documentElement.classList.contains('whitelisting-disabled')).toBe(true);
  });

  it('removes whitelisting-disabled class when called again', () => {
    toggleFiltering(document);
    toggleFiltering(document);

    expect(document.documentElement.classList.contains('whitelisting-disabled')).toBe(false);
  });
});
