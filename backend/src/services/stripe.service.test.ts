const mockAccountsRetrieve = jest.fn();
const mockAccountsCreate = jest.fn();
const mockAccountLinksCreate = jest.fn();
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsCapture = jest.fn();
const mockPaymentIntentsCancel = jest.fn();
const mockRefundsCreate = jest.fn();

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    accounts: {
      retrieve: mockAccountsRetrieve,
      create: mockAccountsCreate,
    },
    accountLinks: { create: mockAccountLinksCreate },
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      capture: mockPaymentIntentsCapture,
      cancel: mockPaymentIntentsCancel,
    },
    refunds: { create: mockRefundsCreate },
  })),
}));
jest.mock('../config/env', () => ({
  env: {
    stripeSecretKey: 'sk_test_mock',
    clientUrl: 'http://test.example',
  },
}));

import {
  getConnectAccount,
  createExpressAccount,
  createOnboardingLink,
  createAccountUpdateLink,
  createPaymentIntent,
  capturePaymentIntent,
  cancelPaymentIntent,
  getAccountRequirements,
  refundPaymentIntent,
} from './stripe.service';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('stripe.service', () => {
  describe('createExpressAccount', () => {
    it('returns account id from Stripe', async () => {
      mockAccountsCreate.mockResolvedValue({ id: 'acct_new' });
      const result = await createExpressAccount('u@example.com', 'https://example.com');
      expect(result).toBe('acct_new');
      expect(mockAccountsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          email: 'u@example.com',
          business_profile: { url: 'https://example.com' },
        })
      );
    });
  });

  describe('createOnboardingLink', () => {
    it('returns link url', async () => {
      mockAccountLinksCreate.mockResolvedValue({ url: 'https://connect.stripe.com/setup' });
      const result = await createOnboardingLink('acct_123');
      expect(result).toBe('https://connect.stripe.com/setup');
      expect(mockAccountLinksCreate).toHaveBeenCalledWith(
        expect.objectContaining({ account: 'acct_123', type: 'account_onboarding' })
      );
    });
  });

  describe('createAccountUpdateLink', () => {
    it('returns url when account_update succeeds', async () => {
      mockAccountLinksCreate.mockResolvedValue({ url: 'https://connect.stripe.com/update' });
      const result = await createAccountUpdateLink('acct_123');
      expect(result).toBe('https://connect.stripe.com/update');
    });

    it('falls back to account_onboarding when account_update fails with specific error', async () => {
      mockAccountLinksCreate
        .mockRejectedValueOnce(
          Object.assign(new Error('account_update requires account_onboarding'), {
            type: 'StripeInvalidRequestError',
            raw: { message: 'account_update account_onboarding' },
          })
        )
        .mockResolvedValueOnce({ url: 'https://connect.stripe.com/onboarding' });
      const result = await createAccountUpdateLink('acct_123');
      expect(result).toBe('https://connect.stripe.com/onboarding');
      expect(mockAccountLinksCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('refundPaymentIntent', () => {
    it('calls refunds.create and returns result', async () => {
      const refund = { id: 're_123' };
      mockRefundsCreate.mockResolvedValue(refund);
      const result = await refundPaymentIntent({ paymentIntentId: 'pi_123', amountCents: 500 });
      expect(result).toEqual(refund);
      expect(mockRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_123',
        amount: 500,
      });
    });
  });

  describe('getConnectAccount', () => {
    it('returns account when retrieve succeeds', async () => {
      const account = { id: 'acct_123' };
      mockAccountsRetrieve.mockResolvedValue(account);
      const result = await getConnectAccount('acct_123');
      expect(result).toEqual(account);
      expect(mockAccountsRetrieve).toHaveBeenCalledWith('acct_123');
    });

    it('returns null when retrieve throws', async () => {
      mockAccountsRetrieve.mockRejectedValue(new Error('Not found'));
      const result = await getConnectAccount('acct_invalid');
      expect(result).toBeNull();
    });
  });

  describe('getAccountRequirements', () => {
    it('returns hasRequirementsDue and currentlyDue from account', async () => {
      mockAccountsRetrieve.mockResolvedValue({
        requirements: { currently_due: ['identity_document'] },
      });
      const result = await getAccountRequirements('acct_123');
      expect(result).toEqual({
        hasRequirementsDue: true,
        currentlyDue: ['identity_document'],
      });
    });

    it('returns empty currentlyDue when not set', async () => {
      mockAccountsRetrieve.mockResolvedValue({});
      const result = await getAccountRequirements('acct_123');
      expect(result).toEqual({
        hasRequirementsDue: false,
        currentlyDue: [],
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('returns id and client_secret from Stripe', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'pi_123_secret_xyz',
      });
      const result = await createPaymentIntent({
        amountCents: 1000,
        currency: 'eur',
        sellerStripeAccountId: 'acct_123',
        applicationFeeAmount: 50,
      });
      expect(result).toEqual({
        id: 'pi_123',
        client_secret: 'pi_123_secret_xyz',
      });
      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          currency: 'eur',
          capture_method: 'manual',
          transfer_data: { destination: 'acct_123' },
          application_fee_amount: 50,
        })
      );
    });
  });

  describe('capturePaymentIntent', () => {
    it('calls Stripe capture and returns result', async () => {
      const intent = { id: 'pi_123', status: 'succeeded' };
      mockPaymentIntentsCapture.mockResolvedValue(intent);
      const result = await capturePaymentIntent('pi_123');
      expect(result).toEqual(intent);
      expect(mockPaymentIntentsCapture).toHaveBeenCalledWith('pi_123');
    });
  });

  describe('cancelPaymentIntent', () => {
    it('calls Stripe cancel and returns result', async () => {
      const intent = { id: 'pi_123', status: 'canceled' };
      mockPaymentIntentsCancel.mockResolvedValue(intent);
      const result = await cancelPaymentIntent('pi_123');
      expect(result).toEqual(intent);
      expect(mockPaymentIntentsCancel).toHaveBeenCalledWith('pi_123');
    });
  });
});
