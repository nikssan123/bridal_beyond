import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initMetaPixel, trackPageView } from '@/lib/metaPixel';

export function useMetaPixelPageView(consentGiven: boolean): void {
  const location = useLocation();

  useEffect(() => {
    if (!consentGiven) return;
    initMetaPixel();
  }, [consentGiven]);

  useEffect(() => {
    if (!consentGiven) return;
    trackPageView();
  }, [consentGiven, location.pathname]);
}

