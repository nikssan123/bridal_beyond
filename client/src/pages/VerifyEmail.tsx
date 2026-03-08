import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { verifyEmail, resendVerificationEmail, clearAuthError } from '@/features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { getAuthErrorKey } from '@/lib/authErrors';
import { trackCompleteRegistration } from '@/lib/metaPixel';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useAppSelector((state) => state.auth);
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setEmail((prev) => (emailFromState ? emailFromState : prev));
  }, [emailFromState]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (resendCooldown <= 0 && cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
  }, [resendCooldown]);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResendSuccess(false);
    dispatch(verifyEmail({ email, code })).then((result) => {
      if (verifyEmail.fulfilled.match(result)) {
        trackCompleteRegistration();
        navigate('/profile');
      }
    });
  };

  const handleResend = async () => {
    const trimmed = email.trim();
    if (!trimmed || resendCooldown > 0 || resendLoading) return;
    setResendSuccess(false);
    setResendError(null);
    setResendLoading(true);
    try {
      await dispatch(resendVerificationEmail(trimmed)).unwrap();
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      cooldownIntervalRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setResendError(typeof err === 'string' ? err : t('auth.resendCodeError', 'Failed to resend code. Try again.'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
          {t('auth.verifyEmailTitle')}
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          {t('auth.verifyEmailSent')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearAuthError())}>
            {t(`authErrors.${getAuthErrorKey(error)}`)}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />
          <TextField
            fullWidth
            label={t('auth.verificationCodeLabel')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            placeholder={t('auth.verificationCodePlaceholder')}
            required
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ py: 1.5 }}
              disabled={status === 'loading' || code.length !== 6}
            >
              {t('auth.confirm')}
            </Button>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('auth.didNotReceiveCode', "Didn't receive the code?")}
              </Typography>
              <Button
                type="button"
                variant="text"
                size="small"
                disabled={resendCooldown > 0 || resendLoading || !email.trim()}
                onClick={handleResend}
                sx={{ minWidth: 'auto', p: 0 }}
              >
                {resendLoading
                  ? t('common.loading', 'Loading...')
                  : resendCooldown > 0
                    ? t('auth.resendCodeIn', { seconds: resendCooldown })
                    : t('auth.resendCode', 'Resend code')}
              </Button>
            </Box>
            {resendSuccess && (
              <Alert severity="success" sx={{ py: 0.5 }} onClose={() => setResendSuccess(false)}>
                {t('auth.resendCodeSuccess', 'A new code has been sent to your email.')}
              </Alert>
            )}
            {resendError && (
              <Alert severity="error" sx={{ py: 0.5 }} onClose={() => setResendError(null)}>
                {resendError}
              </Alert>
            )}
          </Box>
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

export default VerifyEmail;
