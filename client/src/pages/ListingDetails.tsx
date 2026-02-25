import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Grid, Typography, Chip, CircularProgress, Divider, Button,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import PageContainer from '@/components/PageContainer';
import SellerCard from '@/components/SellerCard';
import ReviewList from '@/components/ReviewList';
import ReviewForm from '@/components/ReviewForm';
import RatingDisplay from '@/components/RatingDisplay';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListingById } from '@/features/listings/listingsSlice';
import { fetchReviewsBySellerId } from '@/features/reviews/reviewsSlice';

const conditionLabels: Record<string, string> = {
  new: 'Нова', 'like-new': 'Като нова', good: 'Добро', fair: 'Задоволително',
};

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { selectedListing: listing, status } = useAppSelector((state) => state.listings);
  const sellerId = listing?.seller.id;
  const reviews = useAppSelector((state) => (sellerId ? state.reviews.reviewsBySeller[sellerId] || [] : []));
  const [selectedImg, setSelectedImg] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(fetchListingById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchReviewsBySellerId(sellerId));
    }
  }, [dispatch, sellerId]);

  if (status === 'loading' || !listing) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      </PageContainer>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <PageContainer>
      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={7}>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
            <img
              src={listing.images[selectedImg]}
              alt={listing.title}
              style={{ width: '100%', maxHeight: 560, objectFit: 'cover', borderRadius: 12 }}
            />
          </Box>
          {listing.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {listing.images.map((img, idx) => (
                <Box
                  key={idx}
                  onClick={() => setSelectedImg(idx)}
                  sx={{
                    width: 80, height: 80, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                    border: selectedImg === idx ? '2px solid' : '1px solid',
                    borderColor: selectedImg === idx ? 'primary.dark' : 'divider',
                    opacity: selectedImg === idx ? 1 : 0.7,
                    transition: 'all 0.2s',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Info */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={conditionLabels[listing.condition]} sx={{ bgcolor: 'primary.light' }} />
            <Chip label={`Размер ${listing.size}`} variant="outlined" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>{listing.title}</Typography>
          {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
              {listing.price} лв.
            </Typography>
            <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              {listing.originalPrice} лв.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <Button variant="contained" fullWidth size="large">Свържи се с продавача</Button>
            <Button variant="outlined" sx={{ minWidth: 50 }}><FavoriteBorderIcon /></Button>
            <Button variant="outlined" sx={{ minWidth: 50 }}><ShareIcon /></Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary', mb: 3 }}>
            {listing.description}
          </Typography>

          {/* Measurements */}
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontFamily: "'Playfair Display', serif" }}>
            Размери
          </Typography>
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {Object.entries(listing.measurements).map(([key, val]) => (
              <Grid item xs={6} key={key}>
                <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key === 'bust' ? 'Бюст' : key === 'waist' ? 'Талия' : key === 'hips' ? 'Ханш' : 'Дължина'}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>{val}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip label={`Цвят: ${listing.color}`} size="small" variant="outlined" />
            <Chip label={`Марка: ${listing.brand}`} size="small" variant="outlined" />
          </Box>

          <Divider sx={{ my: 3 }} />
          <SellerCard seller={listing.seller} />
        </Grid>
      </Grid>

      {/* Reviews */}
      <Box sx={{ mt: 6 }}>
        <SectionHeader title="Отзиви за продавача" subtitle={reviews.length > 0 ? `${reviews.length} отзива` : undefined} />
        {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}
        <ReviewList reviews={reviews} />
        <Divider sx={{ my: 3 }} />
        <ReviewForm sellerId={listing.seller.id} />
      </Box>
    </PageContainer>
  );
};

export default ListingDetails;
