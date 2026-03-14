import { describe, it, expect } from 'vitest';
import { getAuthErrorKey } from './authErrors';

describe('getAuthErrorKey', () => {
  it('returns generic for null/undefined/empty', () => {
    expect(getAuthErrorKey(null)).toBe('generic');
    expect(getAuthErrorKey(undefined)).toBe('generic');
    expect(getAuthErrorKey('')).toBe('generic');
  });

  it('maps known backend messages to i18n keys', () => {
    expect(getAuthErrorKey('Invalid email or password')).toBe('invalid_email_or_password');
    expect(getAuthErrorKey('Email already registered')).toBe('email_already_registered');
    expect(getAuthErrorKey('Email not verified')).toBe('email_not_verified');
    expect(getAuthErrorKey('Unauthorized')).toBe('unauthorized');
    expect(getAuthErrorKey('Invalid or expired reset token')).toBe('invalid_reset_token');
    expect(getAuthErrorKey('Invalid or expired reset link')).toBe('invalid_reset_token');
  });

  it('returns network_error for network error message', () => {
    expect(getAuthErrorKey('Network Error')).toBe('network_error');
    expect(getAuthErrorKey('network error')).toBe('network_error');
  });

  it('returns generic for unknown message', () => {
    expect(getAuthErrorKey('Something else')).toBe('generic');
  });
});
