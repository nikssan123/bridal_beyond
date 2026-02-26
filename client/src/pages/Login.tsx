import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Divider, Alert } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, clearAuthError } from '@/features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { getAuthErrorKey } from '@/lib/authErrors';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = (location.state as { resetSuccess?: boolean } | null)?.resetSuccess;
  const redirectTo = new URLSearchParams(location.search).get('redirect');
  const { status, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }))
      .then((result) => {
        if (loginUser.fulfilled.match(result)) navigate(redirectTo || '/profile');
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
          <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">{t('auth.or')}</Typography></Divider>
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
