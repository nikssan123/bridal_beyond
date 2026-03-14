import { describe, it, expect } from 'vitest';
import { isValidEmail, EMAIL_REGEX, EMAIL_MAX_LENGTH } from './validation';

describe('validation', () => {
  describe('EMAIL_REGEX', () => {
    it('matches valid emails', () => {
      expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
      expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
      expect(EMAIL_REGEX.test('user.name+tag@example.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(EMAIL_REGEX.test('')).toBe(false);
      expect(EMAIL_REGEX.test('no-at')).toBe(false);
      expect(EMAIL_REGEX.test('@nodomain.com')).toBe(false);
      expect(EMAIL_REGEX.test('nodomain@')).toBe(false);
    });
  });

  describe('EMAIL_MAX_LENGTH', () => {
    it('is 255', () => {
      expect(EMAIL_MAX_LENGTH).toBe(255);
    });
  });

  describe('isValidEmail', () => {
    it('returns true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });

    it('returns false for empty or over length', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
      const long = 'a'.repeat(256) + '@b.co';
      expect(isValidEmail(long)).toBe(false);
    });

    it('returns false when trimmed length exceeds max', () => {
      const long = 'a'.repeat(254) + '@b.co';
      expect(isValidEmail(long)).toBe(false);
    });

    it('returns false for invalid format', () => {
      expect(isValidEmail('invalid')).toBe(false);
    });
  });
});
