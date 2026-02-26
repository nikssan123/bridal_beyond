# Dispute resolution flows

This document describes how buyer disputes and admin resolution work with Stripe (manual capture and refunds).

## Overview

- **Buyer** can open a dispute from the order details page when the order is `shipped` or `completed`.
- **Admin** can list, view, and resolve disputes at `/admin/disputes`. Resolution triggers Stripe actions (capture, cancel, or refund) and updates the dispute and order in the database.

## Flow by scenario

### Pre-capture disputes (order status: `shipped`)

Payment has been authorized but **not yet captured**. Funds are still on the buyer’s card.

| Admin outcome       | Backend action                                      | Result |
|---------------------|-----------------------------------------------------|--------|
| **Release to seller** | `stripe.paymentIntents.capture()`                   | Funds move to platform then to seller’s connected account; order → `completed`. |
| **Refund buyer**     | `stripe.paymentIntents.cancel()`                    | Authorization released; buyer not charged; order → `cancelled`. |

- **Manual capture window**: Stripe requires capture within a limited time (e.g. 7 days). Resolve pre-capture disputes before the PaymentIntent expires; otherwise capture will fail and you may need to cancel the order or handle it manually in Stripe.

### Post-capture disputes (order status: `completed`)

Payment has already been **captured**. Funds have been transferred to the seller’s connected account.

| Admin outcome       | Backend action                                      | Result |
|---------------------|-----------------------------------------------------|--------|
| **Refund buyer**     | `stripe.refunds.create({ payment_intent, amount })` | Full refund; Stripe debits the connected account and refunds the buyer; order can be updated to `cancelled`. |
| **Partial refund**   | `stripe.refunds.create({ payment_intent, amount })` | Refund for `refundAmountCents`; buyer gets that amount back. |
| **No refund**        | No Stripe call                                     | Dispute marked resolved (e.g. `cancelled`); money stays with seller. |

- **Destination charges**: Payments use `transfer_data.destination` (seller’s connected account). When you create a refund, Stripe debits that connected account (and application fee as applicable) and refunds the buyer. No need to track charge IDs; use `payment_intent` in `refunds.create`.

## API

- **Buyer**: `POST /orders/:orderId/disputes` (body: `reason`, optional `description`), `GET /orders/:orderId/disputes`.
- **Admin**: `GET /admin/disputes?status=open`, `GET /admin/disputes/:id`, `POST /admin/disputes/:id/resolve` (body: `outcome`, optional `refundAmountCents`, `notes`).

## Testing in Stripe test mode

1. **Pre-capture**: Create an order, confirm card payment (PaymentIntent stays `requires_capture`). Seller marks shipped → order `shipped`. Buyer opens dispute. As admin, resolve with “Release to seller” (capture) or “Refund buyer” (cancel). Check Stripe Dashboard: PaymentIntent should show `succeeded` or `canceled`, and Connect transfers as expected.
2. **Post-capture**: Complete an order (buyer confirms receipt → capture). Buyer opens dispute. As admin, resolve with “Refund buyer” (full) or “Partial refund” (set amount). Check Dashboard for Refund and Connect balance.
3. **Edge cases**: Try resolving an already-resolved dispute (should 400). Try confirming receipt while a dispute is open (should 400 with “Cannot confirm receipt while a dispute is open”).

## Security

- Buyer dispute endpoints require the authenticated user to be the order’s buyer.
- Admin endpoints are protected by `requireAdmin` (user role must be `admin`).
- `confirmReceived` is blocked when the order has an open dispute.
