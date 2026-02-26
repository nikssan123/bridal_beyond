import Stripe from 'stripe';
import { env } from '../config/env';

const stripe = new Stripe(env.stripeSecretKey);

export async function createExpressAccount(userEmail: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email: userEmail,
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
