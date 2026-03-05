import React from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Consent = 'accepted' | 'declined' | null;

interface CookieConsentBannerProps {
  onChange: (consent: Consent) => void;
}

const STORAGE_KEY = 'cookie-consent';

export function getStoredConsent(): Consent {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'accepted' || v === 'declined') return v;
  return null;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onChange }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = React.useState(() => getStoredConsent() === null);

  const setConsent = (value: Consent) => {
    if (!value) return;
    window.localStorage.setItem(STORAGE_KEY, value);
    onChange(value);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1400,
        px: 2,
        pb: 2,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: '100%',
          bgcolor: 'background.paper',
          boxShadow: 6,
          borderRadius: 3,
          p: 2,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 1.5,
        }}
      >
        <Typography variant="body2" sx={{ flex: 1 }}>
          {t('cookieConsent.message')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 1,
            mt: isMobile ? 1 : 0,
          }}
        >
          <Button
            variant="text"
            size="small"
            onClick={() => setConsent('declined')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('cookieConsent.decline')}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setConsent('accepted')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('cookieConsent.accept')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CookieConsentBanner;

