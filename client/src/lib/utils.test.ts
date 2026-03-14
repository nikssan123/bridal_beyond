import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles tailwind merge (later wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles empty and undefined', () => {
    expect(cn('a', undefined, null, '')).toBe('a');
  });
});
