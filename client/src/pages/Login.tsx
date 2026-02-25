import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Link as MuiLink, Divider, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, clearAuthError } from '@/features/auth/authSlice';

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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
        if (loginUser.fulfilled.match(result)) navigate('/');
      });
  };

  return (
    <PageContainer maxWidth="xs">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 600 }}>Добре дошли</Typography>
        <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
          Влезте в акаунта си
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearAuthError())}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField fullWidth label="Имейл" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2.5 }} />
          <TextField fullWidth label="Парола" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5, mb: 2 }} disabled={status === 'loading'}>
            Вход
          </Button>
          <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">или</Typography></Divider>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
            Нямате акаунт?{' '}
            <MuiLink component={Link} to="/register" sx={{ color: 'primary.dark', fontWeight: 500 }}>
              Регистрирайте се
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Login;
