---
name: orders_protected_checkout_flow
overview: Add an Order model and protected checkout flow on top of existing Stripe Connect escrow integration, including buyer checkout, seller shipping, buyer confirmation, and adminless capture via buyer confirmation.
todos: []
isProject: false
---

## High-level design

- **Keep existing Stripe Connect + PaymentIntent integration** as-is and layer an `Order` model + routes on top.
- Orders represent a single listing purchase from a buyer to a seller, with a fixed price and Stripe `paymentIntentId` and a simple status state machine.
- **REST** handles order creation, status transitions, and secure access; **Stripe** handles money movement using manual capture and destination charges already configured in the Stripe service.
- Webhooks update the order status to reflect payment authorization/failure, but **capture** only happens when the buyer confirms receipt.

## Backend plan

- **Prisma model** in `[backend/prisma/schema.prisma]`:
  - Add `Order` with:
    - `id` (uuid, PK)
    - `listing_id` (FK `Listing`), `buyer_id` (FK `User`), `seller_id` (FK `User`)
    - `price_cents` (Int) and `platform_fee_cents` (Int)
    - `payment_intent_id` (String, unique)
    - `status` enum or string constrained to: `payment_pending`, `payment_secured`, `shipped`, `completed`, `cancelled`
    - Embedded shipping fields: `shipping_full_name`, `shipping_phone`, `shipping_city`, `shipping_address_line`
    - `courier` (String?), `tracking_number` (String?)
    - `created_at`, `updated_at`
  - Add relations from `User` (`ordersAsBuyer`, `ordersAsSeller`) and `Listing` (`orders`).
  - Generate a migration (e.g. `add_orders`).
- **Orders repository** `[backend/src/modules/orders/ordersRepository.ts]`:
  - `createOrder({ listingId, buyerId, shipping, priceCents, platformFeeCents, paymentIntentId, sellerId })` → creates Order with `status: 'payment_pending'`.
  - `findByIdForUser(orderId, userId)` → returns order only if user is buyer or seller.
  - `findBySellerId(sellerId)` → list for seller dashboard.
  - `updateStatusAndMeta(orderId, updates)` → generic helper to set `status`, `courier`, `tracking_number`, etc.
  - `findByPaymentIntentId(paymentIntentId)` → used by Stripe webhook.
- **Orders controller & routes** `[backend/src/modules/orders/ordersController.ts]`, `[backend/src/modules/orders/ordersRoutes.ts]`:
  - All routes use `authMiddleware`.
  - **POST `/api/orders`**
    - Body Zod schema: `{ listingId: string, shipping: { fullName, phone, city, addressLine } }`.
    - Load listing via existing `listingsRepository.findById`.
    - Reject if listing not found, not active, or buyer is seller.
    - Load seller user and ensure `stripe_account_id` exists (reusing existing Stripe Connect requirement).
    - Compute `amountCents` from listing price and `platformFeeCents` from env `%`.
    - Call existing Stripe service `createPaymentIntent({ amountCents, currency, sellerStripeAccountId, applicationFeeAmount: platformFeeCents })`.
    - Create Order row with `status: 'payment_pending'`, price and fee cents, `payment_intent_id`, buyer/seller IDs, listing ID, and shipping fields.
    - Return `{ orderId, clientSecret, paymentIntentId }`.
  - **GET `/api/orders/:id`**
    - Use repo `findByIdForUser(orderId, req.user.id)`.
    - 404 if not found or unauthorized.
    - Return full order DTO (including embedded listing summary and counterpart user basic info if convenient via `include`).
  - **POST `/api/orders/:id/mark-shipped`** (seller only)
    - Body: `{ courier: string, trackingNumber: string }`.
    - Ensure current user is the order's `seller_id`.
    - Ensure current status is `payment_secured` before allowing transition.
    - Update `courier`, `tracking_number`, `status: 'shipped'`.
    - Return updated order.
  - **POST `/api/orders/:id/confirm-received`** (buyer only)
    - Ensure current user is `buyer_id` and current status is `shipped`.
    - Call Stripe service `capturePaymentIntent(order.payment_intent_id)`.
    - On success, set `status: 'completed'`.
    - Return updated order.
- **Routes wiring** `[backend/src/routes/index.ts]`:
  - Import `ordersRoutes` and mount under `/orders` within `/api` (e.g. `router.use('/orders', ordersRoutes)`; routes file itself can apply `authMiddleware` or index can wrap).
- **Webhook integration** `[backend/src/modules/webhooks/webhooksStripeController.ts]`:
  - Extend existing Stripe webhook handler to:
    - On `payment_intent.succeeded`:
      - Find Order by `payment_intent_id` and, if it exists and status is `payment_pending`, set status to `payment_secured`.
    - On `payment_intent.payment_failed`:
      - Find Order by `payment_intent_id` and set status `cancelled`.
  - Keep Payment model handling intact if already present; this extension is additive.
- **Access control utilities**
  - Optionally add small helpers in orders controller (no separate middleware) to assert `isBuyer` / `isSeller` and throw 403.

## Frontend plan

- **Orders slice** `[client/src/features/orders/ordersSlice.ts]`:
  - State:
    - `currentOrder: Order | null`
    - `myOrders: Order[]`
    - `status: 'idle' | 'loading' | 'succeeded' | 'failed'`
    - `error: string | null`
  - Thunks (using existing `api` Axios instance):
    - `createOrder({ listingId, shipping })` → POST `/orders`, return `{ orderId, clientSecret }`.
    - `fetchOrderById(orderId)` → GET `/orders/:id` → sets `currentOrder`.
    - `fetchMySellerOrders()` → GET `/orders?seller=me` or a dedicated endpoint if needed (alternatively implement on backend as `/orders/seller`).
    - `markAsShipped({ orderId, courier, trackingNumber })` → POST `/orders/:id/mark-shipped` → update `currentOrder` and `myOrders` entry.
    - `confirmReceived(orderId)` → POST `/orders/:id/confirm-received` → update `currentOrder`.
  - Reducers:
    - Handle typical pending/fulfilled/rejected to set `status`/`error`.
    - When `createOrder` resolves, do not yet change `currentOrder` (we navigate to order details after payment); the order detail page will call `fetchOrderById`.
- **Register slice in store** `[client/src/app/store.ts]`:
  - Add `orders: ordersReducer`.
- **Checkout page** `[client/src/pages/Checkout.tsx]`:
  - Route: `/checkout/:listingId` (add in `[client/src/App.tsx]`, inside `ProtectedRoute` since buyer must be authenticated).
  - Behavior:
    - Read `listingId` from params.
    - Either reuse `listingsSlice.fetchListingById` to show a summary card (image, title, price) or call API directly.
    - Render shipping form (fullName, phone, city, addressLine) with basic validation.
    - Use Stripe Elements (app is already wrapped) and `CardElement`.
    - Local component state:
      - `shipping` fields
      - `submitting` flag
      - error message
    - On submit:
      - Call `createOrder` thunk with listingId + shipping; get `{ orderId, clientSecret }`.
      - Call `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })` using `useStripe` and `useElements`.
      - If Stripe confirmation succeeds:
        - Navigate to `/orders/${orderId}`.
      - If Stripe fails:
        - Show error message; optionally call a backend endpoint to cancel or leave the order as `payment_pending` until webhook marks it failed.
- **Order details page** `[client/src/pages/OrderDetails.tsx]`:
  - Route: `/orders/:orderId` (protected).
  - On mount: dispatch `fetchOrderById(orderId)`.
  - Show:
    - Listing summary (link back to listing).
    - Buyer and seller names (if returned), shipping address, courier/tracking when present.
    - A simple **status timeline** based on `order.status`:
      - `payment_pending` – "Awaiting payment confirmation".
      - `payment_secured` – "Payment secured – seller will ship your dress".
      - `shipped` – "Shipped – awaiting your confirmation".
      - `completed` – "Completed".
      - `cancelled` – "Payment failed/cancelled".
    - If current user is **buyer** and status is `shipped`, show "Confirm item received" button that dispatches `confirmReceived(orderId)` and disables while loading.
  - Handle loading/error/empty states gracefully.
- **Seller orders view**
  - Either:
    - Add a new page `[client/src/pages/SellerOrders.tsx]` with route `/seller/orders` (protected), OR
    - Add a third tab to `[client/src/pages/Profile.tsx]` (e.g. `Orders`) leveraging existing profile tabs.
  - On mount, dispatch `fetchMySellerOrders()`.
  - Show a table/grid of orders with columns: listing, buyer name (if allowed), price, status, courier, tracking.
  - For orders with `status === 'payment_secured'`:
    - Provide a "Mark as shipped" button that opens a MUI `Dialog` to input `courier` and `trackingNumber` and dispatches `markAsShipped`.
- **ListingDetails integration** `[client/src/pages/ListingDetails.tsx]`:
  - Existing "Buy with Protection" button should navigate to `/checkout/:listingId` instead of directly creating a payment intent (if create-intent is already wired, refactor the button to route to checkout while leaving existing API available for now).
  - Respect conditions: only show when authenticated, listing is active, and not own listing.

## Validation and security

- Backend must always derive **amount and platform fee from the listing in the DB**, never from client-sent values.
- Access checks:
  - `GET /orders/:id` must ensure `req.user.id` equals `buyer_id` or `seller_id`.
  - `POST /orders/:id/mark-shipped` must ensure `req.user.id === seller_id` and status is `payment_secured`.
  - `POST /orders/:id/confirm-received` must ensure `req.user.id === buyer_id` and status is `shipped`.
- Webhook handler must verify Stripe signature and work on raw body (reusing existing Stripe webhook setup).
- Ensure idempotency of webhook updates (only change status when current state matches the expected previous state).

## Todos

- `backend-orders-model-and-repo`: Add Prisma `Order` model, migration, and `ordersRepository` with find/create/update helpers.
- `backend-orders-routes-and-webhook`: Implement orders controller + routes (`POST /orders`, `GET /orders/:id`, `POST /orders/:id/mark-shipped`, `POST /orders/:id/confirm-received`) and extend Stripe webhook to update Order status by `payment_intent_id`.
- `frontend-orders-slice-and-checkout-page`: Add `ordersSlice`, register it in the store, and implement `/checkout/:listingId` page that creates orders and confirms Stripe payment.
- `frontend-order-details-and-seller-orders`: Implement `/orders/:orderId` page and a seller orders view (page or Profile tab) with mark-as-shipped flow, and wire "Buy with Protection" to go through checkout.

