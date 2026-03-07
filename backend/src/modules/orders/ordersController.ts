import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../prisma';
import * as stripeService from '../../services/stripe.service';
import * as ordersRepository from './ordersRepository';
import * as paymentsRepository from '../payments/paymentsRepository';
import * as disputesRepository from '../disputes/disputesRepository';
import { sendOrderConfirmationEmail, sendSellerNewOrderEmail, sendBuyerOrderShippedEmail, sendSellerBuyerWantsToBuyEmail } from '../../services/mailService';
import * as authRepository from '../auth/authRepository';

const createOrderBody = z.object({
  listingId: z.string().uuid('Invalid listing'),
  shippingAddress: z.object({
    fullName: z.string().trim().min(1, 'Full name is required'),
    phone: z.string().trim().min(3, 'Phone must be at least 3 characters'),
    city: z.string().trim().min(1, 'City is required'),
    addressLine: z.string().trim().min(1, 'Address is required'),
  }),
});

function formatZodMessage(flatten: { formErrors?: string[]; fieldErrors?: Record<string, unknown> }): string {
  const parts: string[] = [];
  if (flatten.formErrors?.length) parts.push(flatten.formErrors.join('. '));
  const field = flatten.fieldErrors ?? {};
  if (Array.isArray(field.listingId) && field.listingId[0]) parts.push(String(field.listingId[0]));
  const addr = field.shippingAddress;
  if (Array.isArray(addr) && addr[0]) parts.push(String(addr[0]));
  else if (addr && typeof addr === 'object' && !Array.isArray(addr)) {
    const a = addr as Record<string, string[] | undefined>;
    const first = (a.fullName ?? a.phone ?? a.city ?? a.addressLine)?.[0];
    if (first) parts.push(first);
  }
  return parts.length ? parts.join('. ') : 'Please check your input and try again.';
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const parsed = createOrderBody.safeParse(req.body);
  const userId = (req as any).user?.id as string | undefined;
  try {
    if (!parsed.success) {
      const friendlyMessage = formatZodMessage(parsed.error.flatten());
      res.status(400).json({ message: friendlyMessage, code: 'VALIDATION_ERROR', errors: parsed.error.flatten() });
      return;
    }
    const { listingId, shippingAddress } = parsed.data;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: true },
    });
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    if (listing.seller_id === userId) {
      res.status(400).json({ message: 'Cannot purchase own listing' });
      return;
    }
    const status = listing.status ?? 'active';
    if (status !== 'active') {
      res.status(400).json({ message: 'Listing not active' });
      return;
    }
    const listingPriceNum = Number(listing.price);
    if (listingPriceNum < 10) {
      res.status(400).json({ message: 'Minimum order amount is 10 €. This listing does not meet the minimum for protected checkout.' });
      return;
    }
    const seller = listing.seller;
    if (!seller?.stripe_account_id) {
      const profileUrl = `${env.clientUrl}/profile`;
      const buyer = await authRepository.findById(userId);
      if (seller.email) {
        await sendSellerBuyerWantsToBuyEmail({
          to: seller.email,
          sellerName: seller.name,
          listingTitle: listing.title,
          profileUrl,
          buyerName: buyer?.name ?? null,
        });
      }
      res.status(400).json({
        code: 'SELLER_PAYMENT_NOT_SET_UP',
        message:
          "This seller hasn't completed payment setup yet, so checkout isn't available. You can send them a private message to ask when they'll be ready to accept orders.",
        sellerId: listing.seller_id,
        listingId: listing.id,
      });
      return;
    }

    const connectAccount = await stripeService.getConnectAccount(seller.stripe_account_id);
    if (!connectAccount) {
      const profileUrl = `${env.clientUrl}/profile`;
      if (seller.email) {
        await sendSellerBuyerWantsToBuyEmail({
          to: seller.email,
          sellerName: seller.name,
          listingTitle: listing.title,
          profileUrl,
          buyerName: (await authRepository.findById(userId))?.name ?? null,
        });
      }
      res.status(400).json({
        code: 'SELLER_PAYMENT_NOT_SET_UP',
        message:
          "This seller hasn't completed payment setup yet, so checkout isn't available. You can send them a private message to ask when they'll be ready to accept orders.",
        sellerId: listing.seller_id,
        listingId: listing.id,
      });
      return;
    }

    if (!connectAccount.charges_enabled) {
      const profileUrl = `${env.clientUrl}/profile`;
      if (seller.email) {
        await sendSellerBuyerWantsToBuyEmail({
          to: seller.email,
          sellerName: seller.name,
          listingTitle: listing.title,
          profileUrl,
          buyerName: (await authRepository.findById(userId))?.name ?? null,
        });
      }
      res.status(400).json({
        code: 'SELLER_PAYMENT_NOT_SET_UP',
        message:
          "This seller hasn't completed payment setup yet, so checkout isn't available. You can send them a private message to ask when they'll be ready to accept orders.",
        sellerId: listing.seller_id,
        listingId: listing.id,
      });
      return;
    }

    const existingActiveOrder = await ordersRepository.findActiveByListingId(listingId);
    if (existingActiveOrder) {
      res.status(400).json({ message: 'An active order already exists for this listing' });
      return;
    }

    const listingPriceCents = Math.round(Number(listing.price) * 100);
    const buyerFeeCents = Math.round(
      listingPriceCents * (env.stripeBuyerFeePercent / 100)
    );
    const amountCents = listingPriceCents + buyerFeeCents;

    // First N orders: no seller commission, only charge buyer fee.
    const totalOrdersSoFar = await ordersRepository.countAll();
    const isWithinFreeSellerCommission =
      totalOrdersSoFar < env.stripeFreeSellerCommissionOrderLimit;

    const sellerCommissionCents = isWithinFreeSellerCommission
      ? 0
      : Math.round(listingPriceCents * (env.stripePlatformFeePercent / 100));

    const platformFeeCents = sellerCommissionCents + buyerFeeCents;

    const { id: paymentIntentId, client_secret } = await stripeService.createPaymentIntent({
      amountCents,
      currency: env.stripeCurrency,
      sellerStripeAccountId: seller.stripe_account_id,
      applicationFeeAmount: platformFeeCents,
    });
    if (!client_secret) {
      res.status(500).json({ message: 'Failed to create payment intent' });
      return;
    }

    await paymentsRepository.create({
      payment_intent_id: paymentIntentId,
      listing_id: listingId,
      buyer_id: userId,
      amount_cents: amountCents,
      status: 'requires_capture',
    });

    const order = await ordersRepository.createOrder({
      listingId,
      buyerId: userId,
      sellerId: listing.seller_id,
      priceCents: amountCents,
      platformFeeCents,
      paymentIntentId,
      shippingFullName: shippingAddress.fullName,
      shippingPhone: shippingAddress.phone,
      shippingCity: shippingAddress.city,
      shippingAddressLine: shippingAddress.addressLine,
    });

    res.status(201).json({
      orderId: order.id,
      clientSecret: client_secret,
      totalCents: amountCents,
      subtotalCents: listingPriceCents,
      buyerFeeCents,
      buyerFeePercent: env.stripeBuyerFeePercent,
    });
  } catch (err: any) {
    console.error('Create order error:', err);
    const code = err?.code ?? err?.raw?.code;
    const param = err?.param ?? err?.raw?.param;
    const isDestinationError =
      (err?.type === 'StripeInvalidRequestError' || code === 'resource_missing') &&
      (param === 'transfer_data[destination]' || err?.message?.includes('No such destination'));
    if (isDestinationError && parsed.success) {
      const { listingId: lid } = parsed.data;
      const listingForEmail = await prisma.listing.findUnique({
        where: { id: lid },
        include: { seller: true },
      });
      const sellerForEmail = listingForEmail?.seller;
      if (sellerForEmail?.email) {
        const profileUrl = `${env.clientUrl}/profile`;
        const buyer = userId ? await authRepository.findById(userId) : null;
        await sendSellerBuyerWantsToBuyEmail({
          to: sellerForEmail.email,
          sellerName: sellerForEmail.name,
          listingTitle: listingForEmail?.title ?? '',
          profileUrl,
          buyerName: buyer?.name ?? null,
        });
      }
      res.status(400).json({
        code: 'SELLER_PAYMENT_NOT_SET_UP',
        message:
          "This seller hasn't completed payment setup yet, so checkout isn't available. You can send them a private message to ask when they'll be ready to accept orders.",
        sellerId: listingForEmail?.seller_id ?? '',
        listingId: lid,
      });
      return;
    }
    res.status(500).json({ message: 'Failed to create order' });
  }
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const order = await ordersRepository.findByIdForUser(orderId, userId);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    const hasOpenDispute = !!(await disputesRepository.findOpenByOrderId(orderId));
    res.json({ ...order, has_open_dispute: hasOpenDispute });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ message: 'Failed to load order' });
  }
}

const markShippedBody = z.object({
  courier: z.string().trim().min(1, 'Courier name is required'),
  trackingNumber: z.string().trim().min(1, 'Tracking number is required'),
});

export async function markShipped(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const parsed = markShippedBody.safeParse(req.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const first = (flat.fieldErrors?.courier ?? flat.fieldErrors?.trackingNumber ?? [])[0];
      const message = typeof first === 'string' ? first : 'Courier and tracking number are required';
      res.status(400).json({ message, code: 'VALIDATION_ERROR', errors: flat });
      return;
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.seller_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (order.status !== 'payment_secured') {
      res.status(400).json({ message: 'Order not ready to be shipped' });
      return;
    }
    const updated = await ordersRepository.setShipmentInfo(orderId, {
      courier: parsed.data.courier,
      trackingNumber: parsed.data.trackingNumber,
    });
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true, listing: true },
    });
    if (orderWithDetails?.buyer?.email && orderWithDetails.listing) {
      const orderUrl = `${env.clientUrl}/orders/${orderId}`;
      await sendBuyerOrderShippedEmail({
        to: orderWithDetails.buyer.email,
        name: orderWithDetails.buyer.name,
        orderUrl,
        listingTitle: orderWithDetails.listing.title,
        courier: parsed.data.courier,
        trackingNumber: parsed.data.trackingNumber,
      });
    }
    res.json(updated);
  } catch (err) {
    console.error('Mark shipped error:', err);
    res.status(500).json({ message: 'Failed to mark order as shipped' });
  }
}

export async function confirmReceived(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.buyer_id !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (order.status !== 'shipped') {
      res.status(400).json({ message: 'Order is not shipped yet' });
      return;
    }

    const openDispute = await disputesRepository.findOpenByOrderId(orderId);
    if (openDispute) {
      res.status(400).json({ message: 'Cannot confirm receipt while a dispute is open' });
      return;
    }

    await stripeService.capturePaymentIntent(order.payment_intent_id);

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'completed' },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Confirm received / capture error:', err);
    const code = err?.code ?? err?.statusCode;
    if (code === 'payment_intent_unexpected_state' || err?.message?.includes('capture')) {
      res.status(400).json({ message: err?.message ?? 'Cannot capture this payment' });
      return;
    }
    res.status(502).json({ message: 'Failed to confirm receipt' });
  }
}

export async function listSellerOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const orders = await ordersRepository.findBySellerId(userId);
    const orderIds = orders.map((o) => o.id);
    const openDisputeOrderIds = await disputesRepository.findOrderIdsWithOpenDispute(orderIds);
    const withDisputeFlag = orders.map((o) => ({
      ...o,
      has_open_dispute: openDisputeOrderIds.includes(o.id),
    }));
    res.json(withDisputeFlag);
  } catch (err) {
    console.error('List seller orders error:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
}

export async function listBuyerOrders(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const orders = await ordersRepository.findByBuyerId(userId);
    const orderIds = orders.map((o) => o.id);
    const openDisputeOrderIds = await disputesRepository.findOrderIdsWithOpenDispute(orderIds);
    const withDisputeFlag = orders.map((o) => ({
      ...o,
      has_open_dispute: openDisputeOrderIds.includes(o.id),
    }));
    res.json(withDisputeFlag);
  } catch (err) {
    console.error('List buyer orders error:', err);
    res.status(500).json({ message: 'Failed to load orders' });
  }
}

