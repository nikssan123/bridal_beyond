import { describe, it, expect, vi } from 'vitest';

vi.mock('./apiBase', () => ({
  API_ORIGIN: 'https://api.example.com',
}));

import { getAvatarUrl } from './avatarUrl';

describe('getAvatarUrl', () => {
  it('returns undefined for null/undefined', () => {
    expect(getAvatarUrl(null)).toBeUndefined();
    expect(getAvatarUrl(undefined)).toBeUndefined();
  });

  it('prepends API_ORIGIN for path starting with /', () => {
    expect(getAvatarUrl('/uploads/avatar.png')).toBe('https://api.example.com/uploads/avatar.png');
  });

  it('returns as-is for full URL', () => {
    expect(getAvatarUrl('https://cdn.example.com/avatar.jpg')).toBe('https://cdn.example.com/avatar.jpg');
  });
});
