import { describe, it, expect } from 'vitest';
import { getAssetPath } from './assetPath';

describe('getAssetPath utility', () => {
  it('returns empty string when given empty input', () => {
    expect(getAssetPath('')).toBe('');
  });

  it('preserves absolute http/https/data/blob URLs', () => {
    expect(getAssetPath('https://example.com/icon.png')).toBe('https://example.com/icon.png');
    expect(getAssetPath('http://example.com/icon.png')).toBe('http://example.com/icon.png');
    expect(getAssetPath('data:image/svg+xml;utf8,...')).toBe('data:image/svg+xml;utf8,...');
    expect(getAssetPath('blob:http://localhost/...')).toBe('blob:http://localhost/...');
  });

  it('correctly resolves relative asset paths with leading slash', () => {
    const resolved = getAssetPath('/assets/hero-student-cat.png');
    expect(resolved).toContain('assets/hero-student-cat.png');
    expect(resolved.startsWith('/')).toBe(true);
  });

  it('correctly resolves relative asset paths without leading slash', () => {
    const resolved = getAssetPath('assets/default-avatar.svg');
    expect(resolved).toContain('assets/default-avatar.svg');
    expect(resolved.startsWith('/')).toBe(true);
  });
});
