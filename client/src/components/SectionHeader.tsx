import React from 'react';
import { Box, Typography } from '@mui/material';

interface Props {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

const SectionHeader: React.FC<Props> = ({ title, subtitle, align = 'left' }) => (
  <Box sx={{ mb: 4, textAlign: align }}>
    <Typography variant="h4" sx={{ fontWeight: 600, mb: subtitle ? 1 : 0 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: align === 'center' ? 'auto' : 0 }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

export default SectionHeader;
