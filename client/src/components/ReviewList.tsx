import React from 'react';
import { Box, Typography, Rating, Avatar, Divider } from '@mui/material';
import type { Review } from '@/data/mockData';

interface Props {
  reviews: Review[];
}

const ReviewList: React.FC<Props> = ({ reviews }) => {
  if (reviews.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        Все още няма отзиви за този потребител.
      </Typography>
    );
  }

  return (
    <Box>
      {reviews.map((review, idx) => (
        <Box key={review.id}>
          <Box sx={{ py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: review.comment ? 1 : 0 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', color: 'primary.contrastText', fontSize: '0.85rem' }}>
                {review.userName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>{review.userName}</Typography>
                <Typography variant="caption" color="text.secondary">{review.createdAt}</Typography>
              </Box>
              <Rating value={review.rating} readOnly size="small" sx={{ ml: 'auto' }} />
            </Box>
            {review.comment && (
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, pl: 6.5 }}>
                {review.comment}
              </Typography>
            )}
          </Box>
          {idx < reviews.length - 1 && <Divider />}
        </Box>
      ))}
    </Box>
  );
};

export default ReviewList;
