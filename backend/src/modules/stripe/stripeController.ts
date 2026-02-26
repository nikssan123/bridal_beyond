import { Request, Response } from 'express';
import * as authRepository from '../auth/authRepository';
import * as stripeService from '../../services/stripe.service';
import { env } from '../../config/env';

export async function connect(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await authRepository.findById(userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    if (user.stripe_account_id) {
      res.status(400).json({ message: 'Already connected' });
      return;
    }
    const businessProfileUrl = `${env.clientUrl}/sellers/${user.id}`;
    const accountId = await stripeService.createExpressAccount(user.email, businessProfileUrl);
    const onboardingUrl = await stripeService.createOnboardingLink(accountId);
    await authRepository.setStripeAccountId(userId, accountId);
    res.status(200).json({ onboardingUrl });
  } catch (err) {
    console.error('Stripe connect error:', err);
    res.status(500).json({ message: 'Failed to create Stripe connect link' });
  }
}

export async function createAccountUpdateLink(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const user = await authRepository.findById(userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    if (!user.stripe_account_id) {
      res.status(400).json({ message: 'Stripe account not connected' });
      return;
    }
    const url = await stripeService.createAccountUpdateLink(user.stripe_account_id);
    res.status(200).json({ accountLinkUrl: url });
  } catch (err) {
    console.error('Stripe account update link error:', err);
    res.status(500).json({ message: 'Failed to create Stripe account update link' });
  }
}
