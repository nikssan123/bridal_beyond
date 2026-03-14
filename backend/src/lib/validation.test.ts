import { EMAIL_REGEX, EMAIL_MAX_LENGTH, EMAIL_INVALID_MESSAGE } from './validation';

describe('validation', () => {
  describe('EMAIL_REGEX', () => {
    it('accepts valid emails', () => {
      expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
      expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
      expect(EMAIL_REGEX.test('user+tag@domain.org')).toBe(true);
      expect(EMAIL_REGEX.test('user.name@sub.domain.com')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(EMAIL_REGEX.test('')).toBe(false);
      expect(EMAIL_REGEX.test('no-at-sign')).toBe(false);
      expect(EMAIL_REGEX.test('@nodomain.com')).toBe(false);
      expect(EMAIL_REGEX.test('nodomain@')).toBe(false);
    });
  });

  describe('EMAIL_MAX_LENGTH', () => {
    it('is 255', () => {
      expect(EMAIL_MAX_LENGTH).toBe(255);
    });
  });

  describe('EMAIL_INVALID_MESSAGE', () => {
    it('is defined', () => {
      expect(EMAIL_INVALID_MESSAGE).toBe('Invalid email');
    });
  });
});
