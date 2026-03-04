import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

const metaAppId = import.meta.env.VITE_META_APP_ID as string | undefined;

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { accessToken: string }; status?: string }) => void,
        options?: { scope: string }
      ) => void;
    };
  }
}

export function MetaLogo(): React.ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface MetaSignInButtonProps {
  onSuccess: (response: { accessToken: string }) => void;
  onError?: () => void;
  /** 'signin' | 'signup' for button label */
  variant?: 'signin' | 'signup';
}

export function MetaSignInButton({ onSuccess, onError, variant = 'signin' }: MetaSignInButtonProps): React.ReactElement | null {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (!metaAppId || window.FB) {
      if (window.FB) setSdkReady(true);
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({
        appId: metaAppId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      setSdkReady(true);
    };
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      delete window.fbAsyncInit;
    };
  }, []);

  if (!metaAppId) return null;

  const handleClick = () => {
    if (!window.FB || !sdkReady) return;
    window.FB.login(
      (response) => {
        if (response.authResponse?.accessToken) {
          onSuccess({ accessToken: response.authResponse.accessToken });
        } else {
          onError?.();
        }
      },
      { scope: 'email,public_profile' }
    );
  };

  const label = variant === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook';

  return (
    <Box
      sx={{
        width: '100%',
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          py: 0.5,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          size="large"
          onClick={handleClick}
          disabled={!sdkReady}
          startIcon={sdkReady ? <MetaLogo /> : <CircularProgress size={20} />}
          sx={{
            textTransform: 'none',
            py: 1.5,
            border: 'none',
            color: 'text.primary',
            '&:hover': { border: 'none', bgcolor: 'transparent' },
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {sdkReady ? label : 'Loading...'}
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}

export { metaAppId };
