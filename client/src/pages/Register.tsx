import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Divider, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { GoogleSignInButton, GoogleLogo, googleClientId } from '@/components/GoogleSignInButton';
import { MetaSignInButton, MetaLogo, metaAppId } from '@/components/MetaSignInButton';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser, loginWithGoogle, loginWithMeta, clearAuthError } from '@/features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { getAuthErrorKey } from '@/lib/authErrors';
import { trackCompleteRegistration } from '@/lib/metaPixel';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = (response: { accessToken: string }) => {
    dispatch(loginWithGoogle(response.accessToken)).then((result) => {
      if (loginWithGoogle.fulfilled.match(result)) navigate('/profile', { replace: true });
    });
  };

  const handleMetaSuccess = (response: { accessToken: string }) => {
    dispatch(loginWithMeta(response.accessToken)).then((result) => {
      if (loginWithMeta.fulfilled.match(result)) navigate('/profile', { replace: true });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(registerUser({ name, email, password })).then((result) => {
      if (registerUser.fulfilled.match(result)) {
        trackCompleteRegistration();
        navigate('/verify-email', { state: { email } });
      }
    });
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>{t('auth.createAccount')}</Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          {t('auth.joinGracia')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearAuthError())}>
            {t(`authErrors.${getAuthErrorKey(error)}`)}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} required sx={{ mb: 2.5 }} />
          <TextField fullWidth label={t('auth.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2.5 }} />
          <TextField fullWidth label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5, mb: 2 }} disabled={status === 'loading'}>
            {t('auth.register')}
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
                text="signup_with"
                onSuccess={handleGoogleSuccess}
                onError={() => dispatch(clearAuthError())}
              />
              {/* TODO: return when we have a meta account */}
              {/* <MetaSignInButton
                variant="signup"
                onSuccess={handleMetaSuccess}
                onError={() => dispatch(clearAuthError())}
              /> */}
            </>
          )}
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            {t('auth.haveAccount')}{' '}
            <MuiLink component={Link} to="/login" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              {t('auth.signInLink')}
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Register;
