import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchOrderById, confirmReceived, createDispute } from '@/features/orders/ordersSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { useTranslation } from 'react-i18next';

const DISPUTE_REASONS = [
  { value: 'delayed', labelKey: 'order.disputeReasonDelayed' },
  { value: 'item_not_as_described', labelKey: 'order.disputeReasonNotAsDescribed' },
  { value: 'damaged', labelKey: 'order.disputeReasonDamaged' },
  { value: 'other', labelKey: 'order.disputeReasonOther' },
];

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { currentOrder, status, error } = useAppSelector((state) => state.orders);
  const currentUser = useAppSelector((state) => state.auth.user);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  const isBuyer = currentUser && currentOrder && currentOrder.buyerId === currentUser.id;
  const isSeller = currentUser && currentOrder && currentOrder.sellerId === currentUser.id;

  const handleConfirmReceived = async () => {
    if (!orderId) return;
    setConfirmLoading(true);
    try {
      await dispatch(confirmReceived(orderId)).unwrap();
    } catch {
      // error handled via slice
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleOpenDisputeClick = () => setDisputeDialogOpen(true);
  const handleDisputeDialogClose = () => {
    setDisputeDialogOpen(false);
    setDisputeReason('');
    setDisputeDescription('');
  };
  const handleDisputeSubmit = async () => {
    if (!orderId || !disputeReason.trim()) return;
    setDisputeSubmitting(true);
    try {
      await dispatch(
        createDispute({
          orderId,
          reason: disputeReason,
          description: disputeDescription.trim() || undefined,
        })
      ).unwrap();
      handleDisputeDialogClose();
    } catch {
      // error in slice
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const canOpenDispute =
    isBuyer &&
    currentOrder &&
    (currentOrder.status === 'shipped' || currentOrder.status === 'completed') &&
    !currentOrder.hasOpenDispute;
  const showConfirmButton =
    isBuyer &&
    currentOrder?.status === 'shipped' &&
    !currentOrder.hasOpenDispute;

  const renderStatusLabel = () => {
    if (!currentOrder) return null;
    switch (currentOrder.status) {
      case 'payment_pending':
        return t('order.paymentPending', 'Awaiting payment confirmation');
      case 'payment_secured':
        return t('order.paymentSecured', 'Payment secured – seller will ship your dress');
      case 'shipped':
        return t('order.shipped', 'Shipped – awaiting your confirmation');
      case 'completed':
        return t('order.completed', 'Completed');
      case 'cancelled':
        return t('order.cancelled', 'Payment failed or cancelled');
      default:
        return currentOrder.status;
    }
  };

  if (!orderId || status === 'loading' || !currentOrder) {
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
        title={t('order.title', 'Order details')}
        subtitle={t('order.subtitle', 'Track the status of your protected purchase.')}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t('order.item', 'Item')}
            </Typography>
            {currentOrder.listing && (
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
                    src={
                      getAvatarUrl(currentOrder.listing.images[0]) ||
                      currentOrder.listing.images[0]
                    }
                    alt={currentOrder.listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    component={RouterLink}
                    to={`/listings/${currentOrder.listing.id}`}
                    sx={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}
                  >
                    {currentOrder.listing.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentOrder.listing.brand} · {currentOrder.listing.size}
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ mt: 2, fontWeight: 700, color: 'secondary.main' }}
                  >
                    {currentOrder.priceCents / 100} лв.
                  </Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('order.status', 'Status')}
              </Typography>
              <Chip label={renderStatusLabel()} color="primary" />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {t('order.shipping', 'Shipping details')}
            </Typography>
            <Typography variant="body2">
              <strong>{currentOrder.shippingFullName}</strong>
            </Typography>
            <Typography variant="body2">{currentOrder.shippingPhone}</Typography>
            <Typography variant="body2">
              {currentOrder.shippingCity}, {currentOrder.shippingAddressLine}
            </Typography>
          </Paper>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {t('order.timeline', 'Order timeline')}
            </Typography>
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {renderStatusLabel()}
              </Typography>
            </Box>
            {currentOrder.courier && currentOrder.trackingNumber && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('order.courier', 'Courier')}: {currentOrder.courier}
                </Typography>
                <Typography variant="body2">
                  {t('order.trackingNumber', 'Tracking number')}: {currentOrder.trackingNumber}
                </Typography>
              </Box>
            )}
            {currentOrder.hasOpenDispute && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('order.disputeOpen', 'You have an open dispute for this order. Our team will review it.')}
              </Alert>
            )}
            {showConfirmButton && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleConfirmReceived}
                  disabled={confirmLoading}
                >
                  {confirmLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    t('order.confirmReceived', 'Confirm item received')
                  )}
                </Button>
              </Box>
            )}
            {canOpenDispute && (
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={handleOpenDisputeClick}>
                  {t('order.openDispute', 'Open dispute')}
                </Button>
              </Box>
            )}
            {isSeller && currentOrder.status === 'payment_secured' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('order.sellerAwaitingShipment', 'Please mark this order as shipped from your dashboard once you send the dress.')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={disputeDialogOpen} onClose={handleDisputeDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('order.openDisputeTitle', 'Open dispute')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>{t('order.disputeReason', 'Reason')}</InputLabel>
            <Select
              value={disputeReason}
              label={t('order.disputeReason', 'Reason')}
              onChange={(e) => setDisputeReason(e.target.value)}
              required
            >
              {DISPUTE_REASONS.map((r) => (
                <MenuItem key={r.value} value={r.value}>
                  {t(r.labelKey, r.value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t('order.disputeDescription', 'Details (optional)')}
            value={disputeDescription}
            onChange={(e) => setDisputeDescription(e.target.value)}
            placeholder={t('order.disputeDescriptionPlaceholder', 'Describe what went wrong...')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDisputeDialogClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleDisputeSubmit}
            disabled={disputeSubmitting || !disputeReason.trim()}
          >
            {disputeSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('order.submitDispute', 'Submit dispute')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default OrderDetails;

