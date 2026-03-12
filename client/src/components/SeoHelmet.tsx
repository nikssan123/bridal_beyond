import React from 'react';
import { useLocation } from 'react-router-dom';

interface SeoHelmetProps {
  title: string;
  description?: string;
}

const SeoHelmet: React.FC<SeoHelmetProps> = ({ title, description }) => {
  const location = useLocation();
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
  const canonical = baseUrl ? `${baseUrl}${location.pathname}${location.search ? '' : ''}` : '';

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
      let metaDesc = document.querySelector<HTMLMetaElement>('meta[name=\"description\"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      if (description) {
        metaDesc.content = description;
      }
      let linkCanonical = document.querySelector<HTMLLinkElement>('link[rel=\"canonical\"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        document.head.appendChild(linkCanonical);
      }
      if (canonical) {
        linkCanonical.href = canonical;
      }
    }
  }, [title, description, canonical]);

  return null;
};

export default SeoHelmet;

