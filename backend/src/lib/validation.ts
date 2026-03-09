/**
 * Email validation regex.
 * Matches common email format: local-part@domain with at least one dot in domain (e.g. user@example.com).
 * Allows letters, digits, and common symbols in local part; letters, digits, hyphens in domain labels.
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const EMAIL_MAX_LENGTH = 255;

export const EMAIL_INVALID_MESSAGE = 'Invalid email';
