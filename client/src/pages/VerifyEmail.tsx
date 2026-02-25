import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { verifyEmail, clearAuthError } from '@/features/auth/authSlice';

const VerifyEmail: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useAppSelector((state) => state.auth);
  const emailFromState = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');

  useEffect(() => {
    setEmail((prev) => (emailFromState ? emailFromState : prev));
  }, [emailFromState]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(verifyEmail({ email, code })).then((result) => {
      if (verifyEmail.fulfilled.match(result)) navigate('/');
    });
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
          Потвърдете имейла си
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          Изпратихме ви код за потвърждение на имейл. Въведете го по-долу.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearAuthError())}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Имейл"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />
          <TextField
            fullWidth
            label="Код за потвърждение (6 цифри)"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            placeholder="000000"
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ py: 1.5, mb: 2 }}
            disabled={status === 'loading' || code.length !== 6}
          >
            Потвърди
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            Вече имате акаунт?{' '}
            <MuiLink component={Link} to="/login" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              Влезте
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default VerifyEmail;
