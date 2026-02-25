import React from 'react';
import { Box, Typography, Rating } from '@mui/material';

interface Props {
  rating: number;
  count: number;
}

const RatingDisplay: React.FC<Props> = ({ rating, count }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Rating value={rating} precision={0.1} readOnly />
    <Typography variant="body2" fontWeight={600}>{rating.toFixed(1)}</Typography>
    <Typography variant="body2" color="text.secondary">({count} отзива)</Typography>
  </Box>
);

export default RatingDisplay;
