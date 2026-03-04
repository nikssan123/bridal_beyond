import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Divider, Alert } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { GoogleSignInButton, GoogleLogo, googleClientId } from '@/components/GoogleSignInButton';
import { MetaSignInButton, MetaLogo, metaAppId } from '@/components/MetaSignInButton';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, loginWithGoogle, loginWithMeta, clearAuthError } from '@/features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { getAuthErrorKey } from '@/lib/authErrors';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess;
  const redirectTo = new URLSearchParams(location.search).get('redirect');
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo || '/profile', { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }))
      .then((result) => {
        if (loginUser.fulfilled.match(result)) navigate(redirectTo || '/profile');
      });
  };

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) return;
    dispatch(loginWithGoogle(credential)).then((result) => {
      if (loginWithGoogle.fulfilled.match(result)) navigate(redirectTo || '/profile', { replace: true });
    });
  };

  const handleMetaSuccess = (response: { accessToken: string }) => {
    dispatch(loginWithMeta(response.accessToken)).then((result) => {
      if (loginWithMeta.fulfilled.match(result)) navigate(redirectTo || '/profile', { replace: true });
    });
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>{t('auth.welcome')}</Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          {t('auth.signInToAccount')}
        </Typography>
        {resetSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('auth.resetSuccessMessage')}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearAuthError())}>
            {t(`authErrors.${getAuthErrorKey(error)}`)}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2.5 }} />
          <TextField fullWidth label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 1.5 }} />
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'right' }}>
            <MuiLink component={Link} to="/forgot-password" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              {t('auth.forgotPassword')}
            </MuiLink>
          </Typography>
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5, mb: 2 }} disabled={status === 'loading'}>
            {t('auth.signIn')}
          </Button>
          {(googleClientId || metaAppId) && (
            <>
              <Divider sx={{ my: 2 }}>
                <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  {t('auth.or')}
                  {googleClientId && <GoogleLogo />}
                  {metaAppId && <MetaLogo />}
                </Typography>
              </Divider>
              <GoogleSignInButton
                text="signin_with"
                onSuccess={handleGoogleSuccess}
                onError={() => dispatch(clearAuthError())}
              />
              <MetaSignInButton
                variant="signin"
                onSuccess={handleMetaSuccess}
                onError={() => dispatch(clearAuthError())}
              />
            </>
          )}
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            {t('auth.noAccount')}{' '}
            <MuiLink component={Link} to="/register" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              {t('auth.registerLink')}
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Login;
