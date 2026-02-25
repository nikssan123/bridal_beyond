import React from 'react';
import { Container, Box } from '@mui/material';

interface Props {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const PageContainer: React.FC<Props> = ({ children, maxWidth = 'lg' }) => (
  <Container maxWidth={maxWidth}>
    <Box sx={{ py: { xs: 3, md: 5 } }}>{children}</Box>
  </Container>
);

export default PageContainer;
