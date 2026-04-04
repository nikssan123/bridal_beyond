import nodemailer from 'nodemailer';
import { mailConfig, isMailConfigured } from '../config/mail';
import {
  getAdminCustomEmailHtml,
  getAdminCustomEmailText,
  getVerificationSubject,
  getVerificationHtml,
  getVerificationText,
  getPasswordResetSubject,
  getPasswordResetHtml,
  getPasswordResetText,
  getNewMessageSubject,
  getNewMessageHtml,
  getNewMessageText,
  getOrderConfirmationSubject,
  getOrderConfirmationHtml,
  getOrderConfirmationText,
  getSellerNewOrderSubject,
  getSellerNewOrderHtml,
  getSellerNewOrderText,
  getBuyerOrderShippedSubject,
  getBuyerOrderShippedHtml,
  getBuyerOrderShippedText,
  getSellerOrderCompletedSubject,
  getSellerOrderCompletedHtml,
  getSellerOrderCompletedText,
  getListingCreatedNoPaymentSubject,
  getListingCreatedNoPaymentHtml,
  getListingCreatedNoPaymentText,
  getSellerBuyerWantsToBuySubject,
  getSellerBuyerWantsToBuyHtml,
  getSellerBuyerWantsToBuyText,
  getSellerConfirmOrderSubject,
  getSellerConfirmOrderHtml,
  getSellerConfirmOrderText,
  getBuyerOrderCancelledSubject,
  getBuyerOrderCancelledHtml,
  getBuyerOrderCancelledText,
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

export interface SendOrderConfirmationEmailParams {
  to: string;
  name: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}

/**
 * Sends an order confirmation email after a protected checkout is created.
 * No-ops if SMTP is not configured.
 */
export async function sendOrderConfirmationEmail(
  params: SendOrderConfirmationEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping order confirmation email to', params.to);
    return;
  }
  const subject = getOrderConfirmationSubject();
  const html = getOrderConfirmationHtml({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
  });
  const text = getOrderConfirmationText({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendSellerNewOrderEmailParams {
  to: string;
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  buyerName?: string | null;
}

/**
 * Sends a notification email to the seller when a protected order is created.
 * No-ops if SMTP is not configured.
 */
export async function sendSellerNewOrderEmail(
  params: SendSellerNewOrderEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping seller new order email to', params.to);
    return;
  }
  const subject = getSellerNewOrderSubject();
  const html = getSellerNewOrderHtml({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
    buyerName: params.buyerName,
  });
  const text = getSellerNewOrderText({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
    buyerName: params.buyerName,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendBuyerOrderShippedEmailParams {
  to: string;
  name: string;
  orderUrl: string;
  listingTitle: string;
  courier: string;
  trackingNumber: string;
}

/**
 * Sends an email to the buyer when the seller marks the order as shipped.
 * No-ops if SMTP is not configured.
 */
export async function sendBuyerOrderShippedEmail(
  params: SendBuyerOrderShippedEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping buyer order shipped email to', params.to);
    return;
  }
  const subject = getBuyerOrderShippedSubject();
  const html = getBuyerOrderShippedHtml({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    courier: params.courier,
    trackingNumber: params.trackingNumber,
  });
  const text = getBuyerOrderShippedText({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    courier: params.courier,
    trackingNumber: params.trackingNumber,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendSellerOrderCompletedEmailParams {
  to: string;
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}

/**
 * Sends an email to the seller when the buyer confirms receipt and the order is completed.
 * Explains that payout will arrive to their IBAN within ~7 days. No-ops if SMTP is not configured.
 */
export async function sendSellerOrderCompletedEmail(
  params: SendSellerOrderCompletedEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn(
      '[mail] SMTP not configured; skipping seller order-completed email to',
      params.to
    );
    return;
  }
  const subject = getSellerOrderCompletedSubject();
  const html = getSellerOrderCompletedHtml({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
  });
  const text = getSellerOrderCompletedText({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendListingCreatedNoPaymentEmailParams {
  to: string;
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
}

/**
 * Sends an email to the seller after they create a listing without a connected payment method.
 * Explains they must connect payment in profile to receive money. No-ops if SMTP is not configured.
 */
export async function sendListingCreatedNoPaymentEmail(
  params: SendListingCreatedNoPaymentEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping listing-created-no-payment email to', params.to);
    return;
  }
  const subject = getListingCreatedNoPaymentSubject();
  const html = getListingCreatedNoPaymentHtml({
    sellerName: params.sellerName,
    listingTitle: params.listingTitle,
    profileUrl: params.profileUrl,
  });
  const text = getListingCreatedNoPaymentText({
    sellerName: params.sellerName,
    listingTitle: params.listingTitle,
    profileUrl: params.profileUrl,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendSellerBuyerWantsToBuyEmailParams {
  to: string;
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
  buyerName?: string | null;
}

/**
 * Sends an urgent email to the seller when a buyer tried to purchase but the seller has no payment method connected.
 * No-ops if SMTP is not configured.
 */
export async function sendSellerBuyerWantsToBuyEmail(
  params: SendSellerBuyerWantsToBuyEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping seller-buyer-wants-to-buy email to', params.to);
    return;
  }
  const subject = getSellerBuyerWantsToBuySubject();
  const html = getSellerBuyerWantsToBuyHtml({
    sellerName: params.sellerName,
    listingTitle: params.listingTitle,
    profileUrl: params.profileUrl,
    buyerName: params.buyerName,
  });
  const text = getSellerBuyerWantsToBuyText({
    sellerName: params.sellerName,
    listingTitle: params.listingTitle,
    profileUrl: params.profileUrl,
    buyerName: params.buyerName,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendSellerConfirmOrderEmailParams {
  to: string;
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  deadlineHours?: number;
  buyerName?: string | null;
}

/**
 * Sends an email to the seller when a protected order is created and is waiting for their confirmation.
 * Explains that the buyer's card is authorized and the seller must confirm or cancel within a time window.
 * No-ops if SMTP is not configured.
 */
export async function sendSellerConfirmOrderEmail(
  params: SendSellerConfirmOrderEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn(
      '[mail] SMTP not configured; skipping seller confirm-order email to',
      params.to
    );
    return;
  }
  const subject = getSellerConfirmOrderSubject();
  const html = getSellerConfirmOrderHtml({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
    deadlineHours: params.deadlineHours,
    buyerName: params.buyerName,
  });
  const text = getSellerConfirmOrderText({
    sellerName: params.sellerName,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
    totalPrice: params.totalPrice,
    deadlineHours: params.deadlineHours,
    buyerName: params.buyerName,
  });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject,
    text,
    html,
  });
}

export interface SendBuyerOrderCancelledEmailParams {
  to: string;
  name: string;
  orderUrl: string;
  listingTitle: string;
}

/**
 * Sends an email to the buyer when their protected order is cancelled.
 * Explains that their card will not be charged and the authorization will be released.
 * No-ops if SMTP is not configured.
 */
export async function sendBuyerOrderCancelledEmail(
  params: SendBuyerOrderCancelledEmailParams
): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping buyer order-cancelled email to', params.to);
    return;
  }
  const subject = getBuyerOrderCancelledSubject();
  const html = getBuyerOrderCancelledHtml({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
  });
  const text = getBuyerOrderCancelledText({
    name: params.name,
    orderUrl: params.orderUrl,
    listingTitle: params.listingTitle,
  });
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

export interface SendAdminCustomEmailParams {
  to: string;
  subject: string;
  message: string;
}

export async function sendAdminCustomEmail(params: SendAdminCustomEmailParams): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.warn('[mail] SMTP not configured; skipping admin custom email to', params.to);
    return;
  }
  const html = getAdminCustomEmailHtml({ title: params.subject, message: params.message });
  const text = getAdminCustomEmailText({ title: params.subject, message: params.message });
  await t.sendMail({
    from: mailConfig.smtpUser,
    to: params.to,
    subject: params.subject,
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
