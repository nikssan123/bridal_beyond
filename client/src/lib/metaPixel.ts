declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    META_PIXEL_INITIALIZED?: boolean;
  }
}

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

export function initMetaPixel(): void {
  if (!META_PIXEL_ID || !window.fbq || window.META_PIXEL_INITIALIZED) return;
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
  window.META_PIXEL_INITIALIZED = true;
}

export function trackPageView(): void {
  if (!window.fbq || !window.META_PIXEL_INITIALIZED) return;
  window.fbq('track', 'PageView');
}

const COMPLETE_REGISTRATION_SENT_KEY = 'meta_complete_registration_sent';

/**
 * Send CompleteRegistration to Meta at most once per session so we don't
 * double-count when multiple code paths fire (e.g. VerifyEmail + redirect, or double submit).
 */
export function trackCompleteRegistration(): void {
  if (!window.fbq || !window.META_PIXEL_INITIALIZED) return;
  try {
    if (sessionStorage.getItem(COMPLETE_REGISTRATION_SENT_KEY) === '1') return;
    sessionStorage.setItem(COMPLETE_REGISTRATION_SENT_KEY, '1');
  } catch {
    // sessionStorage unavailable (e.g. private window)
  }
  window.fbq('track', 'CompleteRegistration');
}

export interface PurchaseEventParams {
  value?: number;
  currency?: string;
  orderId?: string;
  listingId?: string;
}

export function trackPurchase(params: PurchaseEventParams): void {
  if (!window.fbq || !window.META_PIXEL_INITIALIZED) return;
  const payload: Record<string, unknown> = {};
  if (typeof params.value === 'number') {
    payload.value = params.value;
  }
  if (params.currency) {
    payload.currency = params.currency;
  }
  if (params.listingId) {
    payload.content_ids = [params.listingId];
    payload.content_type = 'product';
  }
  if (params.orderId) {
    payload.order_id = params.orderId;
  }
  window.fbq('track', 'Purchase', payload);
}

