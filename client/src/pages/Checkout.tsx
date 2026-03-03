import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListingById } from '@/features/listings/listingsSlice';
import { createOrder } from '@/features/orders/ordersSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { getStripeErrorKey } from '@/lib/stripeErrors';
import { useTranslation } from 'react-i18next';

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const Checkout: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { selectedListing: listing, status: listingStatus } = useAppSelector(
    (state) => state.listings
  );
  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    city: '',
    addressLine: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (listingId) {
      dispatch(fetchListingById(listingId));
    }
  }, [dispatch, listingId]);

  const handleChange =
    (field: keyof typeof shipping) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setShipping((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !listingId) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    setError(null);

    try {
      const orderResult = await dispatch(
        createOrder({
          listingId,
          shippingAddress: {
            fullName: shipping.fullName,
            phone: shipping.phone,
            city: shipping.city,
            addressLine: shipping.addressLine,
          },
        })
      ).unwrap();

      const { orderId, clientSecret } = orderResult;

      const { error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card },
        }
      );

      if (confirmError) {
        const code = (confirmError as any).code as string | undefined;
        const key = getStripeErrorKey(code);
        setError(t(`stripeErrors.${key}`));
        setSubmitting(false);
        return;
      }

      navigate(`/orders/${orderId}`);
    } catch (err: any) {
      const message =
        typeof err === 'string' ? err : t('checkout.genericError', 'Something went wrong. Please try again.');
      setError(message);
      setSubmitting(false);
    }
  };

  if (!listingId || listingStatus === 'loading' || !listing) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="md">
      <SectionHeader
        title={t('checkout.title', 'Protected checkout')}
        subtitle={t('checkout.subtitle', 'Your payment is securely held until you confirm delivery.')}
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('checkout.item', 'Item')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 96,
                  height: 120,
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <img
                  src={getAvatarUrl(listing.images[0]) || listing.images[0]}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {listing.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {listing.brand} · {listing.size}
                </Typography>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 700, color: 'secondary.main' }}>
                  {listing.price} лв.
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px dashed',
                borderColor: 'primary.light',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('checkout.protectionTitle', 'Buyer protection')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t(
                  'checkout.protectionText',
                  'Your payment is held securely. The seller receives the money only after you confirm that you received the dress.'
                )}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Box component="form" onSubmit={handleSubmit}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                {t('checkout.shipping', 'Shipping details')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('checkout.fullName', 'Full name')}
                    value={shipping.fullName}
                    onChange={handleChange('fullName')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('checkout.phone', 'Phone')}
                    value={shipping.phone}
                    onChange={handleChange('phone')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('checkout.city', 'City')}
                    value={shipping.city}
                    onChange={handleChange('city')}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('checkout.address', 'Address line')}
                    value={shipping.addressLine}
                    onChange={handleChange('addressLine')}
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('checkout.payment', 'Payment')}
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  <CardElement options={cardElementOptions} />
                </Box>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 3, py: 1.5 }}
                disabled={submitting || !stripe || !elements}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('checkout.payAndProtect', 'Pay with protection')
                )}
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Checkout;

