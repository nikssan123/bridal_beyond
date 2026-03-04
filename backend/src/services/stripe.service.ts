import Stripe from 'stripe';
import { env } from '../config/env';

const stripe = new Stripe(env.stripeSecretKey);

/** Returns the Connect account if it exists in the current Stripe mode (live/test), else null. */
export async function getConnectAccount(accountId: string): Promise<Stripe.Account | null> {
  try {
    return await stripe.accounts.retrieve(accountId);
  } catch {
    return null;
  }
}

export async function createExpressAccount(
  userEmail: string,
  businessProfileUrl: string
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email: userEmail,
    business_profile: {
      url: businessProfileUrl,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

export async function createOnboardingLink(accountId: string): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${env.clientUrl}/profile`,
    return_url: `${env.clientUrl}/profile`,
  });
  return link.url;
}

/** Returns requirements for a Connect account (e.g. identity document). Used to prompt the user to complete verification. */
export async function getAccountRequirements(accountId: string): Promise<{
  hasRequirementsDue: boolean;
  currentlyDue: string[];
}> {
  const account = await stripe.accounts.retrieve(accountId);
  const currentlyDue = account.requirements?.currently_due ?? [];
  return {
    hasRequirementsDue: currentlyDue.length > 0,
    currentlyDue: Array.isArray(currentlyDue) ? currentlyDue : [],
  };
}

export async function createAccountUpdateLink(accountId: string): Promise<string> {
  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_update',
      refresh_url: `${env.clientUrl}/profile`,
      return_url: `${env.clientUrl}/profile`,
    });
    return link.url;
  } catch (err) {
    const anyErr = err as any;
    const message: string | undefined = anyErr?.raw?.message ?? anyErr?.message;
    // Some accounts only allow account_onboarding links until fully set up.
    const isTypeError =
      anyErr?.type === 'StripeInvalidRequestError' &&
      typeof message === 'string' &&
      message.includes('account_update') &&
      message.includes('account_onboarding');

    if (isTypeError) {
      const fallback = await stripe.accountLinks.create({
        account: accountId,
        type: 'account_onboarding',
        refresh_url: `${env.clientUrl}/profile`,
        return_url: `${env.clientUrl}/profile`,
      });
      return fallback.url;
    }
    throw err;
  }
}

export interface CreatePaymentIntentParams {
  amountCents: number;
  currency: string;
  sellerStripeAccountId: string;
  applicationFeeAmount: number;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<{
  id: string;
  client_secret: string | null;
}> {
  const intent = await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency,
    capture_method: 'manual',
    transfer_data: {
      destination: params.sellerStripeAccountId,
    },
    application_fee_amount: params.applicationFeeAmount,
  });
  return {
    id: intent.id,
    client_secret: intent.client_secret,
  };
}

export async function capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

export interface RefundPaymentIntentParams {
  paymentIntentId: string;
  amountCents?: number;
}

/**
 * Refund a captured payment. For destination charges (transfer_data), Stripe will
 * debit the connected account to refund the buyer. Omit amountCents for full refund.
 */
export async function refundPaymentIntent(
  params: RefundPaymentIntentParams
): Promise<Stripe.Refund> {
  return stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amountCents,
  });
}
