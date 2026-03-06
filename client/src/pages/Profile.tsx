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
import { fetchMyBuyerOrders, fetchMySellerOrders } from '@/features/orders/ordersSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

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

  return (
    <PageContainer>
      {!hasStripeAccount && stripeRequiredForListing && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {t('profile.stripeRequiredForListing', 'To create a listing you must connect your Stripe account. Click the button to set up payouts.')}
        </Alert>
      )}
      {/* Profile header */}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: 4,
          mb: 4,
          bgcolor: 'background.paper',
        }}
      >
        {hasStripeAccount && stripeAccountStatus?.hasRequirementsDue && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                disabled={stripeConnectStatus === 'loading'}
                onClick={async () => {
                  const result = await dispatch(openStripeAccount());
                  if (openStripeAccount.fulfilled.match(result) && result.payload) {
                    window.location.href = result.payload as string;
                  }
                }}
              >
                {stripeConnectStatus === 'loading'
                  ? t('common.loading', 'Loading...')
                  : t('profile.completeVerification', 'Complete verification')}
              </Button>
            }
          >
            {t(
              'profile.stripeVerificationRequired',
              'Stripe needs to verify your identity. Complete verification to avoid disruptions to payouts.'
            )}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={getAvatarUrl(user.avatarUrl) || undefined}
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {user.name.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              {user.isVerified && (
                <Tooltip title={t('profile.verifiedAccount')}>
                  <VerifiedUserIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                </Tooltip>
              )}
            </Box>
            {user.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mt: 0.5 }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">{user.location}</Typography>
              </Box>
            )}
            {user.memberSince && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('profile.memberSince')} {user.memberSince}
              </Typography>
            )}
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                color={hasStripeAccount ? 'success' : 'warning'}
                label={
                  hasStripeAccount
                    ? t('profile.payoutsActive', 'Payouts active')
                    : t('profile.payoutsNotSetup', 'Payouts not set up')
                }
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              sx={{ borderColor: 'primary.main', color: 'primary.dark' }}
            >
              {t('profile.editProfile')}
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0 }}
            >
              {t('profile.deleteAccount', 'Delete account')}
            </Button>
          </Box>
          {hasStripeAccount && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, minWidth: 0 }}>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={
                  stripeConnectStatus === 'loading' ? (
                    <CircularProgress size={20} sx={{ color: 'primary.dark' }} />
                  ) : (
                    <AccountBalanceWalletIcon />
                  )
                }
                disabled={stripeConnectStatus === 'loading'}
                onClick={async () => {
                  const result = await dispatch(openStripeAccount());
                  if (openStripeAccount.fulfilled.match(result) && result.payload) {
                    window.location.href = result.payload as string;
                  }
                }}
                sx={{ borderColor: 'secondary.main', color: 'secondary.dark', whiteSpace: 'nowrap' }}
              >
                {t('profile.editPaymentInfo', 'Edit payment info')}
              </Button>
              <Button
                variant="text"
                size="small"
                disabled={stripeConnectStatus === 'loading'}
                onClick={async () => {
                  const result = await dispatch(openStripeAccount());
                  if (openStripeAccount.fulfilled.match(result) && result.payload) {
                    window.location.href = result.payload as string;
                  }
                }}
                sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
              >
                {t('profile.verifyIdentity', 'Verify identity')}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 260, textAlign: 'right' }}>
                {t(
                  'profile.payoutsDescriptionActive',
                  'Your payouts are active via Stripe. You can update your bank details or verify your identity on Stripe at any time.'
                )}
              </Typography>
            </Box>
          )}
        </Box>
        {stripeConnectError && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {stripeConnectError}
          </Typography>
        )}
      </Box>

      {!hasStripeAccount && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: { xs: 3, sm: 3.5 },
            mb: 4,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {t('profile.payoutInfoTitle')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('profile.payoutInfoSubtitle')}
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2,
                display: 'grid',
                rowGap: 0.5,
              }}
            >
              <Typography component="li" variant="body2" color="text.secondary">
                {t('profile.payoutInfoPoint1')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                {t('profile.payoutInfoPoint2')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                {t('profile.payoutInfoPoint3')}
              </Typography>
            </Box>
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                justifyContent: { xs: 'stretch', sm: 'flex-start' },
              }}
            >
              <Button
                variant={stripeRequiredForListing ? 'contained' : 'outlined'}
                color={stripeRequiredForListing ? 'error' : 'secondary'}
                startIcon={
                  stripeConnectStatus === 'loading' ? (
                    <CircularProgress size={20} sx={{ color: stripeRequiredForListing ? 'inherit' : 'primary.dark' }} />
                  ) : (
                    <AccountBalanceWalletIcon />
                  )
                }
                disabled={stripeConnectStatus === 'loading'}
                onClick={async () => {
                  const result = await dispatch(connectStripe());
                  if (connectStripe.fulfilled.match(result) && result.payload) {
                    window.location.href = result.payload as string;
                  }
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 'auto' },
                  borderColor: 'secondary.main',
                  color: stripeRequiredForListing ? undefined : 'secondary.dark',
                  ...(stripeRequiredForListing && {
                    boxShadow: 2,
                    fontWeight: 600,
                    px: 2.5,
                    py: 1.25,
                    '&:hover': { boxShadow: 4 },
                  }),
                }}
              >
                {t('profile.connectStripe', 'Connect Stripe')}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Reviews – prominent */}
      <Box sx={{ mb: 4 }}>
        <SectionHeader
          title={t('profile.reviews')}
          subtitle={reviews.length > 0 ? t('profile.reviewsCount', { count: reviews.length }) : undefined}
        />
        {reviews.length > 0 && <RatingDisplay rating={avgRating} count={reviews.length} />}
        <Box sx={{ mt: 2, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.default' }}>
          <ReviewList reviews={reviews} />
        </Box>
        {reviews.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
            {t('profile.noReviews')}
          </Typography>
        )}
      </Box>

      {/* Listings – Active / Past */}
      <Box>
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

      {/* Seller orders – My sales */}
      <Box sx={{ mt: 6 }}>
        <SectionHeader
          title={t('profile.mySales', 'My sales')}
          subtitle={t('profile.mySalesSubtitle', 'Orders where you are the seller.')}
        />
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
      </Box>

      {/* Buyer orders – My purchases */}
      <Box sx={{ mt: 6 }}>
        <SectionHeader
          title={t('profile.myPurchases', 'My purchases')}
          subtitle={t('profile.myPurchasesSubtitle', 'Your active and past protected orders.')}
        />
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
      </Box>

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
