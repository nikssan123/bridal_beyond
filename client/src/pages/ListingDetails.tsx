import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  Button,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PageContainer from '@/components/PageContainer';
import SellerCard from '@/components/SellerCard';
import ReviewList from '@/components/ReviewList';
import ReviewForm from '@/components/ReviewForm';
import RatingDisplay from '@/components/RatingDisplay';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { fetchListingById, deleteListing } from '@/features/listings/listingsSlice';
import { fetchReviewsBySellerId } from '@/features/reviews/reviewsSlice';
import { toggleFavorite, fetchFavorites } from '@/features/favorites/favoritesSlice';
import { createOrGetConversation } from '@/features/conversations/conversationsSlice';
import { createPaymentIntent, clearCurrentPayment } from '@/features/payments/paymentsSlice';
import PaymentDialog from '@/components/PaymentDialog';
import SeoHelmet from '@/components/SeoHelmet';

const conditionLabels: Record<string, string> = {
  new: 'Нова', 'like-new': 'Като нова', good: 'Добро', fair: 'Задоволително',
};

const MIN_ORDER_EUR = 10;

const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { selectedListing: listing, status } = useAppSelector((state) => state.listings);
  const listingIds = useAppSelector((state) => state.favorites.listingIds);
  const favoritesStatus = useAppSelector((state) => state.favorites.status);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isFavorite = listing && listingIds.includes(listing.id);
  const isOwnListing = currentUser?.id != null && listing?.seller.id != null && currentUser.id === listing.seller.id;
  const listingActive = listing?.status === undefined || listing?.status === 'active';
  const sellerId = listing?.seller.id;
  const { currentPayment, status: paymentsStatus, error: paymentsError } = useAppSelector((state) => state.payments);
  const reviews = useAppSelector((state) => (sellerId ? state.reviews.reviewsBySeller[sellerId] || [] : []));
  const [selectedImg, setSelectedImg] = useState(0);
  const [advanceReset, setAdvanceReset] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchListingById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (!listing || listing.images.length <= 1) return;
    const intervalId = setInterval(() => {
      setSelectedImg((i) => (i + 1) % listing.images.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [listing?.id, listing?.images?.length, advanceReset]);

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchReviewsBySellerId(sellerId));
    }
  }, [dispatch, sellerId]);

  useEffect(() => {
    if (isAuthenticated && id && favoritesStatus === 'idle' && listingIds.length === 0) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, isAuthenticated, id, favoritesStatus, listingIds.length]);

  useEffect(() => {
    if (paymentsError) {
      setSnackbarMessage(paymentsError);
      setSnackbarOpen(true);
    }
  }, [paymentsError]);

  useEffect(() => {
    if (paymentsStatus === 'succeeded' && currentPayment?.clientSecret) {
      setPaymentDialogOpen(true);
    }
  }, [paymentsStatus, currentPayment?.clientSecret]);

  const handleShare = async () => {
    if (!listing) return;
    const url = `${window.location.origin}/listings/${listing.id}`;
    const title = listing.title;
    const text = `${listing.title} - ${listing.price} €`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
        setSnackbarMessage(t('listing.shareSuccess'));
      } else {
        throw new Error('Share not supported');
      }
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setSnackbarMessage(t('listing.shareLinkCopied'));
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          setSnackbarMessage(t('listing.shareLinkCopied'));
        } finally {
          document.body.removeChild(textarea);
        }
      }
    }
    setSnackbarOpen(true);
  };

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
      <SeoHelmet
        title={`${listing.title} – ${
          listing.category === 'wedding'
            ? t('listing.category_wedding', 'Wedding')
            : listing.category === 'graduation'
              ? t('listing.category_graduation', 'Graduation')
              : listing.category === 'evening'
                ? t('listing.category_evening', 'Evening')
                : t('listing.category_sport_dances', 'Sport dances')
        } | LoveReWorn`}
        description={
          listing.description?.slice(0, 150) ||
          t(
            'home.metaDescription',
            'Buy and sell pre-owned wedding and graduation dresses with buyer protection in Bulgaria.'
          )
        }
      />
      {listing && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: listing.title,
              description: listing.description,
              image: listing.images?.[0],
              brand: listing.brand || undefined,
              sku: listing.id,
              offers: {
                '@type': 'Offer',
                price: listing.price,
                priceCurrency: 'EUR',
                availability:
                  listing.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
              },
            }),
          }}
        />
      )}
      <Grid container spacing={4}>
        {/* Images */}
        <Grid item xs={12} md={7}>
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', mb: 2 }}>
            <img
              key={selectedImg}
              src={getAvatarUrl(listing.images[selectedImg]) || listing.images[selectedImg]}
              alt={listing.title}
              style={{
                width: '100%',
                maxHeight: 560,
                objectFit: 'cover',
                borderRadius: 12,
                transition: 'opacity 0.3s ease',
              }}
            />
            {listing.images.length > 1 && (
              <>
                <IconButton
                  onClick={() => {
                    setSelectedImg((i) => (i - 1 + listing.images.length) % listing.images.length);
                    setAdvanceReset((k) => k + 1);
                  }}
                  size="large"
                  sx={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setSelectedImg((i) => (i + 1) % listing.images.length);
                    setAdvanceReset((k) => k + 1);
                  }}
                  size="large"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                  }}
                  aria-label="Next image"
                >
                  <ChevronRightIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                </IconButton>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 0.75,
                  }}
                >
                  {listing.images.map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedImg(idx)}
                      sx={{
                        width: selectedImg === idx ? 10 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: selectedImg === idx ? 'primary.main' : 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      aria-label={`Image ${idx + 1} of ${listing.images.length}`}
                    />
                  ))}
                </Box>
              </>
            )}
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
                  <img src={getAvatarUrl(img) || img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Info */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mb: 2,
              flexWrap: 'wrap',
            }}
          >
            <Chip label={conditionLabels[listing.condition]} sx={{ bgcolor: 'primary.light' }} />
            <Chip label={`Размер ${listing.size}`} variant="outlined" />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>{listing.title}</Typography>
          {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}

          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
              {listing.price} €
            </Typography>
            <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              {listing.originalPrice} €
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {!isOwnListing && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={async () => {
                    if (!isAuthenticated) {
                      navigate(`/login?redirect=/listings/${id}`);
                      return;
                    }
                    const result = await dispatch(
                      createOrGetConversation({
                        otherUserId: listing.seller.id,
                        listingId: listing.id,
                      })
                    );
                    if (createOrGetConversation.fulfilled.match(result)) {
                      navigate(`/messages/${result.payload.id}`);
                    }
                  }}
                >
                  {t('listing.contactSeller')}
                </Button>
                {listingActive && (
                  <>
                    {Number(listing.price) >= MIN_ORDER_EUR ? (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        fullWidth
                        onClick={() => {
                          if (!listing?.id) return;
                          navigate(`/checkout/${listing.id}`);
                        }}
                      >
                        {isAuthenticated
                          ? t('listing.buyWithProtection', 'Buy with Protection')
                          : t('listing.buyAnonymously', 'Buy with protection (no account)')}
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        {t('listing.minOrderForCheckout', 'Minimum order for protected checkout is 10 €. Contact the seller to arrange the sale.')}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
            {isOwnListing && (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate(`/listings/${listing.id}/edit`)}
                >
                  {t('listing.editListing', 'Edit listing')}
                </Button>
                <Button
                  variant="text"
                  color="error"
                  fullWidth
                  size="large"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {t('listing.deleteListing', 'Delete listing')}
                </Button>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {isAuthenticated && (
                <Button
                  variant="outlined"
                  sx={{ minWidth: 50 }}
                  onClick={() => dispatch(toggleFavorite(listing.id))}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorite ? <FavoriteIcon color="primary" /> : <FavoriteBorderIcon />}
                </Button>
              )}
              <Button
                variant="outlined"
                sx={{ minWidth: 50 }}
                onClick={handleShare}
                aria-label={t('listing.share')}
              >
                <ShareIcon />
              </Button>
            </Box>
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
          {listing.shop && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('listing.fromShop', 'From shop')}{' '}
                <Link to={`/shops/${listing.shop.slug || listing.shop.id}`} style={{ fontWeight: 600, color: 'inherit' }}>
                  {listing.shop.name}
                </Link>
              </Typography>
            </Box>
          )}
          <SellerCard seller={listing.seller} sellerId={listing.seller.id} />
        </Grid>
      </Grid>

      {/* Reviews */}
      <Box sx={{ mt: 6 }}>
        <SectionHeader title="Отзиви за продавача" subtitle={reviews.length > 0 ? `${reviews.length} отзива` : undefined} />
        {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}
        <ReviewList reviews={reviews} />
        <Divider sx={{ my: 3 }} />
        {!isOwnListing && <ReviewForm sellerId={listing.seller.id} />}
        {isOwnListing && (
          <Typography variant="body2" color="text.secondary">
            {t('listing.cannotReviewOwnListing')}
          </Typography>
        )}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Dialog
        open={deleteDialogOpen}
        onClose={() => (deleteLoading ? undefined : setDeleteDialogOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('listing.deleteListing', 'Delete listing')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t(
              'listing.deleteConfirm',
              'Are you sure you want to delete this listing? This action cannot be undone.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteLoading}
            onClick={async () => {
              if (!listing) return;
              setDeleteLoading(true);
              try {
                await dispatch(deleteListing(listing.id)).unwrap();
                setDeleteDialogOpen(false);
                navigate('/listings');
              } catch (err) {
                console.error(err);
                setDeleteLoading(false);
              }
            }}
          >
            {deleteLoading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              t('listing.deleteListing', 'Delete listing')
            )}
          </Button>
        </DialogActions>
      </Dialog>
      {currentPayment?.clientSecret && (
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            dispatch(clearCurrentPayment());
          }}
          clientSecret={currentPayment.clientSecret}
          paymentIntentId={currentPayment.paymentIntentId}
          onSuccess={() => {
            setSnackbarMessage(t('listing.paymentAuthorized', 'Payment authorized'));
            setSnackbarOpen(true);
          }}
        />
      )}
    </PageContainer>
  );
};

export default ListingDetails;
