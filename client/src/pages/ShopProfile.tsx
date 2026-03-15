import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Button,
  Card,
  CardMedia,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ListingCard from '@/components/ListingCard';
import ReviewList from '@/components/ReviewList';
import RatingDisplay from '@/components/RatingDisplay';
import ShopReviewForm from '@/components/ShopReviewForm';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchShopProfile, fetchShopReviews, clearCurrentShop } from '@/features/shops/shopsSlice';
import { fetchListingsByShop } from '@/features/listings/listingsSlice';
import { useTranslation } from 'react-i18next';
import SeoHelmet from '@/components/SeoHelmet';
import { getAvatarUrl } from '@/lib/avatarUrl';

const REVIEWS_PREVIEW = 3;

const ShopProfile: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentShop, currentShopStatus, error, shopReviewsByShop, shopReviewsStatus } = useAppSelector((state) => state.shops);
  const { shopProfileListings, shopProfileListingsStatus } = useAppSelector((state) => state.listings);
  const user = useAppSelector((state) => state.auth.user);
  const canReviewShop = user && currentShop && user.id !== currentShop.ownerId;
  const shopReviews = currentShop ? shopReviewsByShop[currentShop.id] ?? [] : [];
  const [showReviewsSection, setShowReviewsSection] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const reviewsToShow = reviewsExpanded ? shopReviews : shopReviews.slice(0, REVIEWS_PREVIEW);
  const hasMoreReviews = shopReviews.length > REVIEWS_PREVIEW;

  useEffect(() => {
    if (idOrSlug) {
      dispatch(fetchShopProfile(idOrSlug));
    }
    return () => {
      dispatch(clearCurrentShop());
    };
  }, [dispatch, idOrSlug]);

  useEffect(() => {
    if (currentShop?.id) {
      dispatch(fetchListingsByShop({ shopId: currentShop.id, status: 'active' }));
    }
  }, [dispatch, currentShop?.id]);

  const handleViewReviews = () => {
    setShowReviewsSection(true);
    if (idOrSlug && currentShop && !shopReviewsByShop[currentShop.id]) {
      dispatch(fetchShopReviews(idOrSlug));
    }
  };

  if (!idOrSlug) {
    navigate('/shops');
    return null;
  }

  if (currentShopStatus === 'loading' || (currentShopStatus === 'idle' && !currentShop)) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      </PageContainer>
    );
  }

  if (currentShopStatus === 'failed' || !currentShop) {
    return (
      <PageContainer>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {error || t('shops.shopNotFound', 'Shop not found')}
          </Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/shops')}>
            {t('notFound.backHome', 'Back to shops')}
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SeoHelmet
        title={`${currentShop.name} – ${t('shops.shopProfileMetaTitle', 'Shop on LoveReWorn')}`}
        description={
          currentShop.description ||
          t('shops.shopProfileMetaDescription', 'Browse dress listings from this shop on LoveReWorn.')
        }
      />
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        {t('notFound.backHome', 'Back')}
      </Button>

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: { xs: 3, md: 4 } }}>
          <CardMedia
            sx={{
              width: { xs: '100%', md: 200 },
              height: { xs: 200, md: 200 },
              flexShrink: 0,
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentShop.logoUrl ? (
              <Box
                component="img"
                src={getAvatarUrl(currentShop.logoUrl) || currentShop.logoUrl}
                alt=""
                sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', p: 2 }}
              />
            ) : (
              <StorefrontOutlinedIcon sx={{ fontSize: 80, color: 'grey.400' }} />
            )}
          </CardMedia>
          <Box sx={{ flex: 1, minWidth: 0, mt: { xs: 2, md: 0 }, ml: { md: 3 } }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {currentShop.name}
            </Typography>
            {currentShop.address && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 1 }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">{currentShop.address}</Typography>
              </Box>
            )}
            {currentShop.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
                {currentShop.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              {currentShop.reviewSummary && currentShop.reviewSummary.count > 0 ? (
                <>
                  <RatingDisplay
                    rating={currentShop.reviewSummary.averageRating}
                    count={currentShop.reviewSummary.count}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleViewReviews}
                    sx={{ color: 'primary.dark', borderColor: 'primary.dark' }}
                  >
                    {t('profile.viewReviews', 'View reviews')}
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t('profile.noReviewsYet', 'No reviews yet')}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('shops.listingsCount', { count: currentShop.listingsCount })}
            </Typography>
          </Box>
        </Box>
      </Card>

      {showReviewsSection && (
        <Box sx={{ mb: 4 }}>
          <SectionHeader
            title={t('profile.reviews', 'Reviews')}
            subtitle={t('profile.reviewsCount', { count: shopReviews.length })}
          />
          {canReviewShop && idOrSlug && (
            <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default', mb: 2 }}>
              <ShopReviewForm idOrSlug={idOrSlug} />
            </Box>
          )}
          {shopReviewsStatus === 'loading' && shopReviews.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={28} sx={{ color: 'primary.dark' }} />
            </Box>
          ) : shopReviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {t('profile.noReviewsYet', 'No reviews yet')}
            </Typography>
          ) : (
            <>
              <RatingDisplay
                rating={currentShop.reviewSummary?.averageRating ?? 0}
                count={shopReviews.length}
              />
              <Box sx={{ mt: 1.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}>
                <ReviewList reviews={reviewsToShow as Parameters<typeof ReviewList>[0]['reviews']} />
              </Box>
              {hasMoreReviews && (
                <Button
                  variant="text"
                  size="medium"
                  onClick={() => setReviewsExpanded((v) => !v)}
                  sx={{ mt: 1.5, color: 'primary.dark' }}
                >
                  {reviewsExpanded
                    ? t('profile.showLessReviews', 'Show less')
                    : t('profile.viewAllReviews', 'View all reviews ({{count}})', { count: shopReviews.length })}
                </Button>
              )}
            </>
          )}
        </Box>
      )}

      <SectionHeader
        title={t('shops.shopListings', 'Listings from this shop')}
        subtitle={t('listings.foundCount', { count: shopProfileListings.length })}
      />
      {shopProfileListingsStatus === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      ) : shopProfileListings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">{t('listings.noResults')}</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {shopProfileListings.map((listing) => (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <ListingCard listing={listing} />
            </Grid>
          ))}
        </Grid>
      )}
    </PageContainer>
  );
};

export default ShopProfile;
