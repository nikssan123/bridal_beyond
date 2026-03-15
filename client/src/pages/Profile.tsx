import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
  Alert,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import EditIcon from '@mui/icons-material/Edit';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import ReviewList from '@/components/ReviewList';
import ListingCard from '@/components/ListingCard';
import RatingDisplay from '@/components/RatingDisplay';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMe, updateProfile, uploadAvatar, deleteAccount, logout } from '@/features/auth/authSlice';
import { connectStripe, openStripeAccount, fetchStripeAccountStatus } from '@/features/stripe/stripeSlice';
import { fetchReviewsBySellerId } from '@/features/reviews/reviewsSlice';
import { fetchListingsBySeller } from '@/features/listings/listingsSlice';
import { fetchMyShop } from '@/features/shops/shopsSlice';
import {
  fetchMyBuyerOrders,
  fetchMySellerOrders,
  sellerConfirmOrder,
  sellerRejectOrder,
} from '@/features/orders/ordersSlice';
import { pushNotification } from '@/features/notifications/notificationsSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import SafetyInfoCard from '@/components/SafetyInfoCard';
import SeoHelmet from '@/components/SeoHelmet';

/** Avatar URL is internal if it is a path like /uploads/avatars/... (uploaded via app). */
function isInternalAvatarUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/');
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const stripeRequiredForListing = searchParams.get('stripe_required') === '1';
  const { profileListings, profileListingsStatus } = useAppSelector((state) => state.listings);
  const reviews = useAppSelector((state) =>
    user ? state.reviews.reviewsBySeller[user.id] || [] : []
  );
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authStatus = useAppSelector((state) => state.auth.status);
  const authError = useAppSelector((state) => state.auth.error);
  const stripeConnectStatus = useAppSelector((state) => state.stripe.connectStatus);
  const stripeConnectError = useAppSelector((state) => state.stripe.connectError);
  const stripeAccountStatus = useAppSelector((state) => state.stripe.accountStatus);
  const stripeAccountStatusLoading = useAppSelector((state) => state.stripe.accountStatusLoading);
  const { buyerOrders, buyerOrdersStatus, myOrders, sellerOrdersStatus } = useAppSelector(
    (state) => state.orders
  );
  const { myShop, myShopStatus } = useAppSelector((state) => state.shops);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderUpdateError, setOrderUpdateError] = useState<string | null>(null);
  const [ordersTab, setOrdersTab] = useState<'seller' | 'buyer'>('seller');
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const REVIEWS_PREVIEW = 3;
  const reviewsToShow = reviewsExpanded ? reviews : reviews.slice(0, REVIEWS_PREVIEW);
  const hasMoreReviews = reviews.length > REVIEWS_PREVIEW;
  const [stripeRedirectUrl, setStripeRedirectUrl] = useState<string | null>(null);
  const [stripeCountdown, setStripeCountdown] = useState(15);

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      dispatch(fetchReviewsBySellerId(user.id));
      dispatch(fetchListingsBySeller({ sellerId: user.id, status: tab === 'active' ? 'active' : 'sold' }));
      dispatch(fetchMyBuyerOrders());
      dispatch(fetchMySellerOrders());
      dispatch(fetchMyShop());
    }
  }, [dispatch, user?.id, tab]);

  useEffect(() => {
    if (user && editOpen) {
      setEditName(user.name);
      setEditLocation(user.location ?? '');
      setEditAvatarUrl(isInternalAvatarUrl(user.avatarUrl) ? '' : (user.avatarUrl ?? ''));
      setUploadError(null);
    }
  }, [user, editOpen]);

  useEffect(() => {
    if (user?.hasStripeAccount) {
      dispatch(fetchStripeAccountStatus());
    }
  }, [dispatch, user?.hasStripeAccount]);

  useEffect(() => {
    if (!user) return;
    if (!user.hasStripeAccount) {
      dispatch(
        pushNotification({
          id: 'stripe-setup',
          type: 'stripe',
          title: t('profile.payoutsNotSetup', 'Payouts not set up'),
          body: t(
            'profile.payoutsNotificationBody',
            'Connect your payout account to start receiving money for your sales.'
          ),
          href: '/profile',
          createdAt: new Date().toISOString(),
          read: false,
        })
      );
    } else if (stripeAccountStatus?.hasRequirementsDue) {
      dispatch(
        pushNotification({
          id: 'stripe-verification',
          type: 'stripe',
          title: t('profile.payoutsNeedsVerification', 'Payouts need verification'),
          body: t(
            'profile.payoutsNotificationVerify',
            'Your payment provider needs additional verification to keep payouts active.'
          ),
          href: '/profile',
          createdAt: new Date().toISOString(),
          read: false,
        })
      );
    }
  }, [dispatch, stripeAccountStatus, t, user]);

  // Stripe redirect dialog: countdown then redirect
  useEffect(() => {
    if (!stripeRedirectUrl || stripeCountdown <= 0) return;
    const id = setInterval(() => setStripeCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [stripeRedirectUrl, stripeCountdown]);
  useEffect(() => {
    if (stripeRedirectUrl && stripeCountdown === 0) {
      window.location.href = stripeRedirectUrl;
      setStripeRedirectUrl(null);
    }
  }, [stripeRedirectUrl, stripeCountdown]);

  const handleStripeRedirect = (url: string) => {
    setStripeRedirectUrl(url);
    setStripeCountdown(20);
  };
  const closeStripeDialog = () => {
    setStripeRedirectUrl(null);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(t('profile.fileMustBeImage'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setUploadError(t('profile.fileTooLarge'));
      return;
    }
    setUploadError(null);
    dispatch(uploadAvatar(file));
  };

  const handleSaveProfile = () => {
    if (!user) return;
    dispatch(
      updateProfile({
        name: editName || undefined,
        location: editLocation || null,
        avatarUrl: isInternalAvatarUrl(user.avatarUrl) ? user.avatarUrl : (editAvatarUrl || null),
      })
    ).then(() => {
      setEditOpen(false);
      dispatch(fetchMe());
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    const result = await dispatch(deleteAccount());
    setDeleteLoading(false);
    if (deleteAccount.fulfilled.match(result)) {
      dispatch(logout());
      window.location.href = '/';
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'primary.dark' }} />
        </Box>
      </PageContainer>
    );
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const hasStripeAccount = !!user.hasStripeAccount;
  const hasStripeRequirementsDue = !!(hasStripeAccount && stripeAccountStatus?.hasRequirementsDue);

  return (
    <PageContainer>
      <SeoHelmet
        title={t('profile.metaTitle', 'My profile – LoveReWorn')}
        description={t(
          'profile.metaDescription',
          'Manage your listings, payouts and protected orders on LoveReWorn.'
        )}
      />
      {!hasStripeAccount && stripeRequiredForListing && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {t('profile.paymentRequiredForPayouts', 'To receive payments from buyers you must connect a payment method. Click the red button below to set up payouts.')}
        </Alert>
      )}
      <SafetyInfoCard
        title={t('safety.keepCommunicationOnPlatformTitle')}
        body={t('safety.keepCommunicationOnPlatformBody')}
      />
      {/* Profile header – compact */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 2, sm: 3 },
          mb: 3,
          bgcolor: 'background.paper',
        }}
      >
        {hasStripeAccount && stripeAccountStatus?.hasRequirementsDue && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-start' },
              '& .MuiAlert-message': { minWidth: 0, overflowWrap: 'break-word' },
              '& .MuiAlert-action': { marginTop: { xs: 1.5, sm: 0 }, alignSelf: { xs: 'stretch', sm: 'center' } },
            }}
            action={
              <Button
                color="inherit"
                size="small"
                disabled={stripeConnectStatus === 'loading'}
                onClick={async () => {
                  const result = await dispatch(openStripeAccount());
                  if (openStripeAccount.fulfilled.match(result) && result.payload) {
                    handleStripeRedirect(result.payload as string);
                  }
                }}
                sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
              >
                {stripeConnectStatus === 'loading'
                  ? t('common.loading', 'Loading...')
                  : t('profile.completeVerification', 'Complete verification')}
              </Button>
            }
          >
            {t(
              'profile.verificationRequired',
              'Our payment provider needs to verify your identity. Complete verification to avoid disruptions to payouts.'
            )}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={getAvatarUrl(user.avatarUrl) || undefined}
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '1.75rem',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              {user.isVerified && (
                <Tooltip title={t('profile.verifiedAccount')}>
                  <VerifiedUserIcon sx={{ fontSize: 22, color: 'primary.main' }} />
                </Tooltip>
              )}
              <Chip
                size="small"
                color={
                  !hasStripeAccount
                    ? 'warning'
                    : hasStripeRequirementsDue
                      ? 'warning'
                      : 'success'
                }
                label={
                  !hasStripeAccount
                    ? t('profile.payoutsNotSetup', 'Payouts not set up')
                    : hasStripeRequirementsDue
                      ? t('profile.payoutsNeedsVerification', 'Payouts need verification')
                      : t('profile.payoutsActive', 'Payouts active')
                }
                sx={{ ml: 0.5 }}
              />
            </Box>
            {(user.location || user.memberSince) && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {[user.location, user.memberSince && t('profile.memberSince') + ' ' + user.memberSince]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              sx={{ borderColor: 'primary.main', color: 'primary.dark' }}
            >
              {t('profile.editProfile')}
            </Button>
            <Button
              variant="outlined"
              size="medium"
              color="secondary"
              startIcon={
                stripeConnectStatus === 'loading' ? (
                  <CircularProgress size={18} sx={{ color: 'primary.dark' }} />
                ) : (
                  <AccountBalanceWalletIcon />
                )
              }
              disabled={stripeConnectStatus === 'loading'}
              onClick={async () => {
                if (hasStripeAccount) {
                  const result = await dispatch(openStripeAccount());
                  if (openStripeAccount.fulfilled.match(result) && result.payload) {
                    handleStripeRedirect(result.payload as string);
                  }
                } else {
                  const result = await dispatch(connectStripe());
                  if (connectStripe.fulfilled.match(result) && result.payload) {
                    handleStripeRedirect(result.payload as string);
                  }
                }
              }}
              sx={{ borderColor: 'secondary.main', color: 'secondary.dark', whiteSpace: 'nowrap' }}
            >
              {hasStripeAccount ? t('profile.editPaymentInfo', 'Edit payment info') : t('profile.connectPayment', 'Connect payment')}
            </Button>
          </Box>
        </Box>
        {stripeConnectError && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {stripeConnectError}
          </Typography>
        )}
      </Box>

      {/* Shop + Payout in one row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {myShopStatus === 'succeeded' || myShopStatus === 'failed' ? (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                p: 3,
                height: '100%',
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <StorefrontOutlinedIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('shops.myShop', 'Your shop')}
                </Typography>
              </Box>
              {myShop ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{myShop.name}</Typography>
                  <Chip
                    size="small"
                    label={
                      myShop.status === 'approved'
                        ? t('shops.statusApproved', 'Approved')
                        : myShop.status === 'pending'
                          ? t('shops.statusPending', 'Pending approval')
                          : t('shops.statusRejected', 'Rejected')
                    }
                    color={myShop.status === 'approved' ? 'success' : myShop.status === 'pending' ? 'warning' : 'default'}
                  />
                  {myShop.status === 'approved' && (
                    <Button
                      component={Link}
                      to={`/shops/${myShop.slug || myShop.id}`}
                      variant="outlined"
                      size="small"
                      sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                    >
                      {t('shops.viewMyShop', 'View my shop')}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t('shops.enlistCta', 'List your boutique or shop on LoveReWorn. Apply to become a verified shop.')}
                  </Typography>
                  <Button component={Link} to="/shops/enlist" variant="outlined" size="small" startIcon={<StorefrontOutlinedIcon />} sx={{ alignSelf: 'flex-start', mt: 0.5 }}>
                    {t('shops.enlistYourShop', 'Enlist your shop')}
                  </Button>
                </>
              )}
            </Box>
          </Grid>
        ) : null}
        <Grid item xs={12} md={myShopStatus === 'succeeded' || myShopStatus === 'failed' ? 6 : 12}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              p: 3,
              height: '100%',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t('profile.payoutInfoTitle')}
              </Typography>
            </Box>
            {hasStripeAccount ? (
              <>
                <Chip
                  size="small"
                  color={hasStripeRequirementsDue ? 'warning' : 'success'}
                  label={
                    hasStripeRequirementsDue
                      ? t('profile.payoutsNeedsVerification', 'Payouts need verification')
                      : t('profile.payoutsActive', 'Payouts active')
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6, mt: 0.5 }}
                >
                  {hasStripeRequirementsDue
                    ? t('profile.payoutsDescriptionPending')
                    : t('profile.payoutsDescriptionActive')}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<AccountBalanceWalletIcon />}
                  disabled={stripeConnectStatus === 'loading'}
                  onClick={async () => {
                    const result = await dispatch(openStripeAccount());
                    if (openStripeAccount.fulfilled.match(result) && result.payload) {
                      handleStripeRedirect(result.payload as string);
                    }
                  }}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  {t('profile.editPaymentInfo', 'Edit payment info')}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {t('profile.payoutInfoSubtitle')}
                </Typography>
                <Button
                  variant={stripeRequiredForListing ? 'contained' : 'outlined'}
                  color={stripeRequiredForListing ? 'error' : 'secondary'}
                  size="small"
                  startIcon={
                    stripeConnectStatus === 'loading' ? (
                      <CircularProgress size={16} sx={{ color: stripeRequiredForListing ? 'inherit' : 'primary.dark' }} />
                    ) : (
                      <AccountBalanceWalletIcon />
                    )
                  }
                  disabled={stripeConnectStatus === 'loading'}
                  onClick={async () => {
                    const result = await dispatch(connectStripe());
                    if (connectStripe.fulfilled.match(result) && result.payload) {
                      handleStripeRedirect(result.payload as string);
                    }
                  }}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  {t('profile.connectPayment', 'Connect payment')}
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Reviews */}
      <Box sx={{ mb: 3 }}>
        <SectionHeader
          title={t('profile.reviews')}
          subtitle={reviews.length > 0 ? t('profile.reviewsCount', { count: reviews.length }) : undefined}
        />
        {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}
        {reviews.length > 0 && (
          <>
            <Box sx={{ mt: 1.5, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}>
              <ReviewList reviews={reviewsToShow} />
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
                  : t('profile.viewAllReviews', 'View all reviews ({{count}})', { count: reviews.length })}
              </Button>
            )}
          </>
        )}
        {reviews.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            {t('profile.noReviews')}
          </Typography>
        )}
      </Box>

      {/* Listings – Active / Past */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={t('profile.activeListings')} value="active" />
          <Tab label={t('profile.pastListings')} value="past" />
        </Tabs>
        {profileListingsStatus === 'loading' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: 'primary.dark' }} />
          </Box>
        ) : profileListings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
            {tab === 'active' ? t('listings.noResults') : t('listings.noResults')}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {profileListings.map((listing) => (
              <Grid item xs={12} sm={6} md={4} key={listing.id}>
                <ListingCard listing={listing} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Orders – As seller / As buyer */}
      <Box sx={{ mt: 4 }}>
        <SectionHeader
          title={t('profile.orders', 'Orders')}
          subtitle={t('profile.ordersSubtitle', 'Your sales and purchases.')}
        />
        <Tabs value={ordersTab} onChange={(_, v) => setOrdersTab(v)} sx={{ mb: 2, minHeight: 40 }}>
          <Tab label={t('profile.mySales', 'My sales')} value="seller" />
          <Tab label={t('profile.myPurchases', 'My purchases')} value="buyer" />
        </Tabs>
        {orderUpdateError && ordersTab === 'seller' && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrderUpdateError(null)}>
            {orderUpdateError}
          </Alert>
        )}
        {ordersTab === 'seller' && (
          <>
            {sellerOrdersStatus === 'loading' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: 'primary.dark' }} />
              </Box>
            ) : myOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t('profile.noSales', 'You have no sales yet.')}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {myOrders.map((order) => (
                  <Grid item xs={12} md={6} key={order.id}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                      }}
                    >
                      {order.listing && order.listing.images[0] && (
                        <Avatar
                          variant="rounded"
                          src={getAvatarUrl(order.listing.images[0]) || undefined}
                          sx={{ width: 72, height: 90, borderRadius: 2 }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          noWrap
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {order.listing?.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, fontWeight: 600, color: 'secondary.main' }}
                        >
                          {order.priceCents / 100} €
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {order.status === 'payment_pending'
                            ? t(
                              'order.paymentPending',
                              'Waiting for seller confirmation – your card is authorized but not yet charged'
                            )
                            : order.status === 'payment_secured'
                              ? t(
                                'order.paymentSecured',
                                'Payment secured – seller will ship your dress'
                              )
                              : order.status === 'shipped'
                                ? t('order.shippedSeller', 'Shipped – awaiting buyer confirmation')
                                : order.status === 'completed'
                                  ? t('order.completed', 'Completed')
                                  : t('order.cancelled', 'Payment failed or cancelled')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        {order.status === 'payment_pending' ? (
                          <>
                            <Chip
                              size="small"
                              color="warning"
                              label={t(
                                'profile.orderAwaitingConfirmation',
                                'Awaiting your confirmation'
                              )}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                disabled={updatingOrderId === order.id}
                                onClick={async () => {
                                  setOrderUpdateError(null);
                                  setUpdatingOrderId(order.id);
                                  try {
                                    await dispatch(
                                      sellerConfirmOrder({ orderId: order.id })
                                    ).unwrap();
                                  } catch (e: any) {
                                    setOrderUpdateError(
                                      e?.message ??
                                      t(
                                        'profile.orderUpdateError',
                                        'Failed to update order. Please try again.'
                                      )
                                    );
                                  } finally {
                                    setUpdatingOrderId(null);
                                  }
                                }}
                              >
                                {t('profile.confirmOrder', 'Confirm order')}
                              </Button>
                              <Button
                                variant="text"
                                size="small"
                                color="inherit"
                                disabled={updatingOrderId === order.id}
                                onClick={async () => {
                                  setOrderUpdateError(null);
                                  setUpdatingOrderId(order.id);
                                  try {
                                    await dispatch(
                                      sellerRejectOrder({ orderId: order.id })
                                    ).unwrap();
                                  } catch (e: any) {
                                    setOrderUpdateError(
                                      e?.message ??
                                      t(
                                        'profile.orderUpdateError',
                                        'Failed to update order. Please try again.'
                                      )
                                    );
                                  } finally {
                                    setUpdatingOrderId(null);
                                  }
                                }}
                              >
                                {t('profile.rejectOrderNoStock', 'Reject – no stock')}
                              </Button>
                            </Box>
                          </>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            href={`/orders/${order.id}`}
                          >
                            {t('profile.viewOrder', 'View')}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
        {ordersTab === 'buyer' && (
          <>
            {buyerOrdersStatus === 'loading' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: 'primary.dark' }} />
              </Box>
            ) : buyerOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                {t('profile.noPurchases', 'You have no purchases yet.')}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {buyerOrders.map((order) => (
                  <Grid item xs={12} md={6} key={order.id}>
                    <Box
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                      }}
                    >
                      {order.listing && order.listing.images[0] && (
                        <Avatar
                          variant="rounded"
                          src={getAvatarUrl(order.listing.images[0]) || undefined}
                          sx={{ width: 72, height: 90, borderRadius: 2 }}
                        />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          noWrap
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {order.listing?.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ mt: 0.5, fontWeight: 600, color: 'secondary.main' }}
                        >
                          {order.priceCents / 100} €
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {order.status}
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        href={`/orders/${order.id}`}
                      >
                        {t('profile.viewOrder', 'View')}
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>

      {/* Stripe redirect dialog – what is Stripe + countdown */}
      <Dialog open={!!stripeRedirectUrl} onClose={closeStripeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('profile.stripeDialogTitle', 'Payment setup')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'profile.stripeDescriptionShort',
              'Stripe is our payment partner so we can send your earnings to your bank (IBAN). You’ll enter your details once on their secure page.'
            )}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {stripeCountdown > 0
              ? t('profile.stripeRedirectCountdown', 'You will be redirected to the setup page in {{count}} seconds…', { count: stripeCountdown })
              : t('profile.stripeRedirecting', 'Redirecting…')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeStripeDialog} color="inherit">
            {t('profile.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => stripeRedirectUrl && (window.location.href = stripeRedirectUrl)}
            disabled={stripeCountdown <= 0}
          >
            {t('profile.stripeContinueNow', 'Continue to setup now')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('profile.editProfile')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 1 }}>
            <Avatar
              src={getAvatarUrl(user.avatarUrl) || undefined}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                hidden
                onChange={handleAvatarFileChange}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  authStatus === 'loading' ? (
                    <CircularProgress size={16} sx={{ color: 'primary.dark' }} />
                  ) : (
                    <AddPhotoAlternateOutlinedIcon />
                  )
                }
                onClick={() => fileInputRef.current?.click()}
                disabled={authStatus === 'loading'}
                sx={{ borderColor: 'primary.main', color: 'primary.dark' }}
              >
                {t('profile.uploadPhoto')}
              </Button>
              {(uploadError || authError) && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  {uploadError || authError}
                </Typography>
              )}
            </Box>
          </Box>
          <TextField
            fullWidth
            label={t('auth.name')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('profile.location')}
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            sx={{ mb: 2 }}
          />
          {!isInternalAvatarUrl(user.avatarUrl) && (
            <TextField
              fullWidth
              label={t('profile.avatarUrl')}
              value={editAvatarUrl}
              onChange={(e) => setEditAvatarUrl(e.target.value)}
              placeholder={t('profile.avatarUrlPlaceholder')}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('profile.cancel')}</Button>
          <Button variant="contained" onClick={handleSaveProfile}>
            {t('profile.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => (deleteLoading ? null : setDeleteDialogOpen(false))} maxWidth="xs" fullWidth>
        <DialogTitle>{t('profile.deleteAccountTitle', 'Delete account')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t(
              'profile.deleteAccountWarning',
              'This action will permanently remove your access to this account. Your past orders and messages may be kept in anonymized form for security and legal reasons.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleteLoading} onClick={() => setDeleteDialogOpen(false)}>
            {t('profile.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={18} sx={{ color: 'common.white' }} /> : t('profile.deleteAccountConfirm', 'Delete account')}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Profile;
