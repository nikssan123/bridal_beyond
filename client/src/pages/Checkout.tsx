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
  Chip,
  Divider,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchListingById } from '@/features/listings/listingsSlice';
import { createOrder } from '@/features/orders/ordersSlice';
import { createOrGetConversation } from '@/features/conversations/conversationsSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { getStripeErrorKey } from '@/lib/stripeErrors';
import { useTranslation } from 'react-i18next';

const cardElementOptions = { hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#2D2D2D',
      fontFamily: "'Work Sans', sans-serif",
      '::placeholder': { color: '#aab7c4' },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const BUYER_FEE_PERCENT = 5;
const MIN_ORDER_EUR = 10;

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
  const [sellerNoPayment, setSellerNoPayment] = useState<{
    message: string;
    sellerId: string;
    listingId: string;
  } | null>(null);

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

    const trimmed = {
      fullName: shipping.fullName.trim(),
      phone: shipping.phone.trim(),
      city: shipping.city.trim(),
      addressLine: shipping.addressLine.trim(),
    };
    if (!trimmed.fullName || !trimmed.phone || !trimmed.city || !trimmed.addressLine) {
      setError(t('checkout.shippingRequired', 'Please fill in all shipping fields.'));
      return;
    }
    if (trimmed.phone.length < 3) {
      setError(t('checkout.phoneTooShort', 'Phone number must be at least 3 characters.'));
      return;
    }
    const price = Number(listing?.price);
    if (!Number.isFinite(price) || price < MIN_ORDER_EUR) {
      setError(t('checkout.minOrder', 'Minimum order amount is 10 €.'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const orderResult = await dispatch(
        createOrder({
          listingId,
          shippingAddress: trimmed,
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
      setSubmitting(false);
      const payload = err && typeof err === 'object' ? err : undefined;
      const code = payload?.code;
      const sellerId = payload?.sellerId;
      const listingId = payload?.listingId;
      if (code === 'SELLER_PAYMENT_NOT_SET_UP' && sellerId && listingId) {
        setSellerNoPayment({
          message: t(
            'checkout.sellerNoPayment',
            "This seller hasn't completed payment setup yet, so checkout isn't available. You can send them a private message to ask when they'll be ready to accept orders."
          ),
          sellerId,
          listingId,
        });
        setError(null);
        return;
      }
      const message =
        typeof err === 'string'
          ? err
          : (payload && typeof payload.message === 'string' ? payload.message : null) ??
            err?.response?.data?.message ??
            err?.message ??
            t('checkout.genericError', 'Something went wrong. Please try again.');
      setError(message);
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

  const belowMinOrder = Number(listing.price) < MIN_ORDER_EUR;

  return (
    <PageContainer maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Chip
          label={t('checkout.stepLabel', 'Shipping & payment')}
          size="small"
          sx={{
            mb: 2,
            fontWeight: 600,
            letterSpacing: 0.5,
            bgcolor: 'primary.light',
            color: 'primary.dark',
          }}
        />
        <SectionHeader
          title={t('checkout.title', 'Protected checkout')}
          subtitle={t('checkout.subtitle', 'Your payment is securely held until you confirm delivery.')}
        />
      </Box>

      {belowMinOrder && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('checkout.minOrder', 'Minimum order amount is 10 €.')}{' '}
          <Typography component="span" variant="body2">
            {t('checkout.minOrderContact', 'You can contact the seller to arrange the sale.')}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              borderColor: 'divider',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontSize: '0.7rem', letterSpacing: 1.2, color: 'text.secondary', mb: 1.5 }}
            >
              {t('checkout.item', 'Item')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  width: 100,
                  height: 132,
                  borderRadius: 2,
                  overflow: 'hidden',
                  flexShrink: 0,
                  bgcolor: 'action.hover',
                }}
              >
                <img
                  src={getAvatarUrl(listing.images[0]) || listing.images[0]}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {listing.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {listing.brand} · {listing.size}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('checkout.subtotal', 'Subtotal')}: {listing.price} €
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('checkout.buyerFee', 'Buyer fee (5%)')}: {(listing.price * (BUYER_FEE_PERCENT / 100)).toFixed(2)} €
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: 'secondary.main' }}>
                    {t('checkout.total', 'Total')}: {(listing.price * (1 + BUYER_FEE_PERCENT / 100)).toFixed(2)} €
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'primary.light',
                border: '1px solid',
                borderColor: 'primary.main',
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
              }}
            >
              <ShieldOutlinedIcon sx={{ color: 'primary.dark', mt: 0.25, fontSize: 22 }} />
              <Box>
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
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box component="form" onSubmit={handleSubmit}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontSize: '0.7rem', letterSpacing: 1.2, color: 'text.secondary' }}
              >
                {t('checkout.shipping', 'Shipping details')}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
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

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="overline"
                sx={{ fontSize: '0.7rem', letterSpacing: 1.2, color: 'text.secondary' }}
              >
                {t('checkout.payment', 'Payment')}
              </Typography>
              <Box
                sx={{
                  mt: 1.5,
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <CardElement options={cardElementOptions} />
              </Box>

              {sellerNoPayment && (
                <Alert
                  severity="warning"
                  sx={{ mt: 2 }}
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        if (!sellerNoPayment) return;
                        try {
                          const conv = await dispatch(
                            createOrGetConversation({
                              otherUserId: sellerNoPayment.sellerId,
                              listingId: sellerNoPayment.listingId,
                            })
                          ).unwrap();
                          navigate(`/messages/${conv.id}`);
                        } catch {
                          setError(t('checkout.messageSellerFailed', 'Could not open conversation. Please try again.'));
                        } finally {
                          setSellerNoPayment(null);
                        }
                      }}
                    >
                      {t('checkout.messageSeller', 'Message seller')}
                    </Button>
                  }
                >
                  {sellerNoPayment.message}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 3, py: 1.5 }}
                disabled={submitting || !stripe || !elements || belowMinOrder}
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
