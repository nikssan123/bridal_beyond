import React, { useState } from 'react';
import { Box, TextField, Button, Rating, Typography } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { addShopReview } from '@/features/shops/shopsSlice';
import { useTranslation } from 'react-i18next';

interface Props {
  idOrSlug: string;
}

const ShopReviewForm: React.FC<Props> = ({ idOrSlug }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    try {
      await dispatch(
        addShopReview({ idOrSlug, rating, comment: comment.trim() || undefined })
      ).unwrap();
      setRating(0);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
        {t('profile.writeReview', 'Write a review')}
      </Typography>
      {user && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('profile.publishReviewAs', 'Your review will be published as {{name}}.', {
            name: user.name,
          })}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2">{t('profile.ratingLabel', 'Rating')}:</Typography>
        <Rating value={rating} onChange={(_, v) => setRating(v)} />
      </Box>
      <TextField
        fullWidth
        multiline
        rows={3}
        size="small"
        label={t('profile.comment', 'Comment')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button type="submit" variant="contained" disabled={!rating || submitting}>
        {submitting ? t('profile.submitting', 'Sending…') : t('profile.submitReview', 'Submit review')}
      </Button>
    </Box>
  );
};

export default ShopReviewForm;
