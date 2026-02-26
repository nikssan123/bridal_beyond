/**
 * Maps backend auth error messages to i18n keys under authErrors.*
 */
const MESSAGE_TO_KEY: Record<string, string> = {
  'Invalid email or password': 'invalid_email_or_password',
  'Login failed': 'login_failed',
  'Registration failed': 'registration_failed',
  'Email already registered': 'email_already_registered',
  'Invalid or expired verification code': 'invalid_verification_code',
  'Verification failed': 'verification_failed',
  'Invalid or expired reset token': 'invalid_reset_token',
  'Invalid or expired reset link': 'invalid_reset_token',
  'Reset failed': 'reset_failed',
  'Request failed': 'request_failed',
  Unauthorized: 'unauthorized',
};

export function getAuthErrorKey(message: string | null | undefined): string {
  if (!message) return 'generic';
  const key = MESSAGE_TO_KEY[message];
  if (key) return key;
  if (/network error/i.test(message)) return 'network_error';
  return 'generic';
}
