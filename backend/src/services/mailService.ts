import nodemailer from 'nodemailer';
import { mailConfig, isMailConfigured } from '../config/mail';
import {
  getVerificationSubject,
  getVerificationHtml,
  getVerificationText,
  getPasswordResetSubject,
  getPasswordResetHtml,
  getPasswordResetText,
  getNewMessageSubject,
  getNewMessageHtml,
  getNewMessageText,
} from '../emails/templates';

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (transport) return transport;
  if (!isMailConfigured()) return null;
  const { smtpHost, smtpPort, smtpUser, smtpClientId, smtpClientSecret, smtpRefreshToken } =
    mailConfig;
  if (
    !smtpHost ||
    smtpPort == null ||
    !smtpUser ||
    !smtpClientId ||
    !smtpClientSecret ||
    !smtpRefreshToken
  ) {
    return null;
  }
  transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: smtpUser,
      clientId: smtpClientId,
      clientSecret: smtpClientSecret,
      refreshToken: smtpRefreshToken,
    },
  });
  return transport;
}

export interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
}

/**
 * Sends the email verification message. No-ops if SMTP is not configured (e.g. in dev).
 */
export async function sendVerificationEmail(params: SendVerificationEmailParams): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping verification email to', params.to);
    return;
  }
  const subject = getVerificationSubject();
  const html = getVerificationHtml({ name: params.name, code: params.code });
  const text = getVerificationText({ name: params.name, code: params.code });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetLink: string;
}

/**
 * Sends the password reset email with a link. No-ops if SMTP is not configured.
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping password reset email to', params.to);
    return;
  }
  const subject = getPasswordResetSubject();
  const html = getPasswordResetHtml({ name: params.name, resetLink: params.resetLink });
  const text = getPasswordResetText({ name: params.name, resetLink: params.resetLink });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendNewMessageEmailParams {
  to: string;
  recipientName: string;
  senderName: string;
  listingTitle?: string | null;
  messagesUrl: string;
}

/**
 * Sends a "new message" notification to the recipient. No-ops if SMTP is not configured.
 */
export async function sendNewMessageEmail(
  params: SendNewMessageEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping new message email to', params.to);
    return;
  }
  const subject = getNewMessageSubject();
  const html = getNewMessageHtml({
    recipientName: params.recipientName,
    senderName: params.senderName,
    listingTitle: params.listingTitle,
    messagesUrl: params.messagesUrl,
  });
  const text = getNewMessageText({
    recipientName: params.recipientName,
    senderName: params.senderName,
    listingTitle: params.listingTitle,
    messagesUrl: params.messagesUrl,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}
