import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Alert } from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { resetPassword, clearAuthError } from '@/features/auth/authSlice';

const ResetPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { status, error } = useAppSelector((state) => state.auth);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (password !== confirmPassword) {
      setLocalError('Паролите не съвпадат.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Паролата трябва да е поне 6 символа.');
      return;
    }
    dispatch(resetPassword({ token, password })).then((result) => {
      if (resetPassword.fulfilled.match(result)) {
        navigate('/login', { state: { resetSuccess: true } });
      }
    });
  };

  if (!token) {
    return (
      <PageContainer maxWidth="xs">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
            Невалидна връзка
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
            Липсва или е невалидна връзка за нулиране на парола. Моля, заявете нова.
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/forgot-password" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              Заявка за нова парола
            </MuiLink>
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>
          Нова парола
        </Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          Въведете новата си парола.
        </Typography>
        {(localError || error) && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => {
              setLocalError('');
              dispatch(clearAuthError());
            }}
          >
            {localError || error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Нова парола"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 2.5 }}
          />
          <TextField
            fullWidth
            label="Потвърдете паролата"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            Нулиране на парола
          </Button>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/forgot-password" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              Заявка за нова парола
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ResetPassword;
