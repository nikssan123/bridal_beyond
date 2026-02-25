import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { forgotPassword, clearAuthError } from '@/features/auth/authSlice';

const ForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    dispatch(forgotPassword({ email })).then((result) => {
      if (forgotPassword.fulfilled.match(result)) setSuccess(true);
    });
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
          Забравена парола
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          Въведете имейла си и ще ви изпратим инструкции за нулиране на паролата.
        </Typography>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Ако имейлът съществува, ще получите инструкции за нулиране на паролата.
          </Alert>
        )}
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
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ py: 1.5, mb: 2 }}
            disabled={status === 'loading'}
          >
            Изпрати
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/login" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              Обратно към вход
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ForgotPassword;
