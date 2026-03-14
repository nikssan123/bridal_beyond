import {
  getVerificationSubject,
  getVerificationHtml,
  getVerificationText,
  getPasswordResetSubject,
  getPasswordResetHtml,
  getPasswordResetText,
} from './templates';

describe('templates', () => {
  describe('verification', () => {
    it('getVerificationSubject returns subject string', () => {
      expect(getVerificationSubject()).toMatch(/LoveReWorn|имейл/);
    });

    it('getVerificationHtml includes name and code', () => {
      const html = getVerificationHtml({ name: 'Alice', code: '123456' });
      expect(html).toContain('Alice');
      expect(html).toContain('123456');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('getVerificationText includes name and code', () => {
      const text = getVerificationText({ name: 'Bob', code: '654321' });
      expect(text).toContain('Bob');
      expect(text).toContain('654321');
    });
  });

  describe('password reset', () => {
    it('getPasswordResetSubject returns subject', () => {
      expect(getPasswordResetSubject()).toMatch(/парола|LoveReWorn/);
    });

    it('getPasswordResetHtml includes name and resetLink', () => {
      const html = getPasswordResetHtml({
        name: 'User',
        resetLink: 'https://example.com/reset',
      });
      expect(html).toContain('User');
      expect(html).toContain('https://example.com/reset');
    });

    it('getPasswordResetText includes name and resetLink', () => {
      const text = getPasswordResetText({
        name: 'User',
        resetLink: 'https://example.com/reset',
      });
      expect(text).toContain('User');
      expect(text).toContain('https://example.com/reset');
    });
  });
});
