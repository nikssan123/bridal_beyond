/**
 * Email validation regex. Must match backend (backend/src/lib/validation.ts).
 * Matches common email format: local-part@domain with at least one dot in domain.
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const EMAIL_MAX_LENGTH = 255;

export function isValidEmail(value: string): boolean {
  if (!value || value.length > EMAIL_MAX_LENGTH) return false;
  return EMAIL_REGEX.test(value.trim());
}
