import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '@/app/hooks';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, status } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const hasToken =
    typeof window !== 'undefined' ? Boolean(localStorage.getItem('token')) : false;

  // If we have a token but auth is still being resolved, show a loader instead of redirecting.
  if (!isAuthenticated && hasToken && (status === 'idle' || status === 'loading')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    const search = location.search || '';
    const redirect = encodeURIComponent(`${location.pathname}${search}`);
    return (
      <Navigate
        to={`/login?redirect=${redirect}`}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
