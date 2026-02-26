/**
 * Mail configuration from environment variables.
 * All SMTP fields are optional so the app can run without mail (e.g. dev);
 * when missing, the mail service will no-op on send.
 */
function getEnvOptional(key: string): string | undefined {
  return process.env[key];
}

export const mailConfig = {
  smtpHost: getEnvOptional('SMTP_HOST'),
  smtpPort: getEnvOptional('SMTP_PORT')
    ? parseInt(process.env.SMTP_PORT!, 10)
    : undefined,
  smtpUser: getEnvOptional('SMTP_USER'),
  smtpClientId: getEnvOptional('SMTP_CLIENT_ID'),
  smtpClientSecret: getEnvOptional('SMTP_CLIENT_SECRET'),
  smtpRefreshToken: getEnvOptional('SMTP_REFRESH_TOKEN'),
};

export function isMailConfigured(): boolean {
  return !!(
    mailConfig.smtpHost &&
    mailConfig.smtpPort &&
    mailConfig.smtpUser &&
    mailConfig.smtpClientId &&
    mailConfig.smtpClientSecret &&
    mailConfig.smtpRefreshToken
  );
}
