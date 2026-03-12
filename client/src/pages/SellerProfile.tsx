import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Button,
  Tooltip,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ReviewList from '@/components/ReviewList';
import ListingCard from '@/components/ListingCard';
import RatingDisplay from '@/components/RatingDisplay';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchSellerProfile, clearCurrentSeller } from '@/features/sellers/sellersSlice';
import { fetchListingsBySeller } from '@/features/listings/listingsSlice';
import { fetchReviewsBySellerId } from '@/features/reviews/reviewsSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { useTranslation } from 'react-i18next';
import SeoHelmet from '@/components/SeoHelmet';

const SellerProfile: React.FC = () => {
  const { id: sellerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentSeller, status, error } = useAppSelector((state) => state.sellers);
  const { profileListings, profileListingsStatus } = useAppSelector((state) => state.listings);
  const reviews = useAppSelector((state) =>
    sellerId ? state.reviews.reviewsBySeller[sellerId] || [] : []
  );
  const [tab, setTab] = React.useState<'listings' | 'reviews'>('listings');

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerProfile(sellerId));
      dispatch(fetchListingsBySeller({ sellerId, status: 'active' }));
      dispatch(fetchReviewsBySellerId(sellerId));
    }
    return () => {
      dispatch(clearCurrentSeller());
    };
  }, [dispatch, sellerId]);

  if (!sellerId) {
    navigate('/listings');
    return null;
  }

  if (status === 'loading' || (status === 'idle' && !currentSeller)) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      </PageContainer>
    );
  }

  if (status === 'failed' || !currentSeller) {
    return (
      <PageContainer>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {error || t('profile.sellerNotFound', 'Seller not found')}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
            {t('notFound.backHome', 'Go back')}
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <PageContainer>
      <SeoHelmet
        title={`${currentSeller.name} – ${t('profile.sellerProfileMetaTitle', 'Seller profile on LoveReWorn')}`}
        description={t(
          'profile.sellerProfileMetaDescription',
          'View this seller’s verified profile, reviews and active dress listings on LoveReWorn.'
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: currentSeller.name,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            address: currentSeller.location || undefined,
            aggregateRating:
              reviews.length > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: avgRating.toFixed(1),
                    reviewCount: reviews.length,
                  }
                : undefined,
          }),
        }}
      />
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        {t('notFound.backHome', 'Back')}
      </Button>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          mb: 4,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={getAvatarUrl(currentSeller.avatar) || undefined}
            sx={{
              width: { xs: 72, md: 88 },
              height: { xs: 72, md: 88 },
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {currentSeller.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {currentSeller.name}
              </Typography>
              {currentSeller.isVerified && (
                <Tooltip title={t('profile.verifiedAccount', 'Verified account')}>
                  <VerifiedUserIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Tooltip>
              )}
            </Box>
            {currentSeller.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">{currentSeller.location}</Typography>
              </Box>
            )}
            {currentSeller.memberSince && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {t('profile.memberSince')} {currentSeller.memberSince}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {currentSeller.isVerified && (
                <Chip
                  size="small"
                  icon={<VerifiedUserIcon sx={{ fontSize: 16 }} />}
                  label={t('profile.verifiedAccount', 'Verified account')}
                  sx={{ fontWeight: 500 }}
                />
              )}
              {currentSeller.hasPaymentSetup ? (
                <Chip
                  size="small"
                  icon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
                  label={t('profile.acceptsProtectedPayments', 'Accepts protected payments')}
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              ) : (
                <Chip
                  size="small"
                  icon={<AccountBalanceWalletIcon sx={{ fontSize: 16 }} />}
                  label={t(
                    'profile.doesNotAcceptProtectedPayments',
                    "Doesn't accept protected payments yet"
                  )}
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              )}
              <Chip
                size="small"
                label={t('profile.listingsCount', { count: currentSeller.listings })}
                variant="outlined"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 0.5 }}>
            <RatingDisplay rating={currentSeller.rating} count={reviews.length} />
            <Typography variant="caption" color="text.secondary">
              {reviews.length === 0
                ? t('profile.noReviews', 'No reviews yet')
                : t('profile.reviewsCount', { count: reviews.length })}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={t('profile.activeListings', 'Active listings')} value="listings" />
        <Tab label={t('profile.reviews', 'Reviews')} value="reviews" />
      </Tabs>

      {tab === 'listings' && (
        <>
          <SectionHeader
            title={t('profile.activeListings', 'Active listings')}
            subtitle={
              profileListingsStatus === 'succeeded'
                ? t('listings.foundCount', { count: profileListings.length })
                : undefined
            }
          />
          {profileListingsStatus === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: 'primary.dark' }} />
            </Box>
          )}
          {profileListingsStatus === 'succeeded' && profileListings.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
              {t('listings.noResults', 'No listings found')}
            </Typography>
          )}
          {profileListingsStatus === 'succeeded' && profileListings.length > 0 && (
            <Grid container spacing={3}>
              {profileListings.map((listing) => (
                <Grid item xs={12} sm={6} md={4} key={listing.id}>
                  <ListingCard listing={listing} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tab === 'reviews' && (
        <>
          <SectionHeader
            title={t('profile.reviews', 'Reviews')}
            subtitle={
              reviews.length > 0 ? t('profile.reviewsCount', { count: reviews.length }) : undefined
            }
          />
          {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}
          <Box
            sx={{
              mt: 2,
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              bgcolor: 'background.default',
            }}
          >
            <ReviewList reviews={reviews} />
          </Box>
        </>
      )}
    </PageContainer>
  );
};

export default SellerProfile;
