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

export function trackCompleteRegistration(): void {
  if (!window.fbq || !window.META_PIXEL_INITIALIZED) return;
  window.fbq('track', 'CompleteRegistration');
}

