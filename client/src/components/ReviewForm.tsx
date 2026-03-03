import React, { useState } from 'react';
import { Box, TextField, Button, Rating, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addReview } from '@/features/reviews/reviewsSlice';

interface Props {
  sellerId: string;
}

const ReviewForm: React.FC<Props> = ({ sellerId }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    dispatch(addReview({ sellerId, rating, comment: comment.trim() || undefined }));
    setRating(0);
    setComment('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        Напишете отзив
      </Typography>
      {user && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Ще публикуваме отзива като <strong>{user.name}</strong>.
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2">Оценка:</Typography>
        <Rating value={rating} onChange={(_, v) => setRating(v)} />
      </Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        size="small"
        label="Коментар"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" disabled={!rating}>
        Изпрати отзив
      </Button>
    </Box>
  );
};

export default ReviewForm;
