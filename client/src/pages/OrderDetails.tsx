import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Grid,
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchOrderById, confirmReceived, createDispute, markAsShipped } from '@/features/orders/ordersSlice';
import { getAvatarUrl } from '@/lib/avatarUrl';
import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/features/orders/ordersSlice';

const DISPUTE_REASONS = [
  { value: 'delayed', labelKey: 'order.disputeReasonDelayed' },
  { value: 'item_not_as_described', labelKey: 'order.disputeReasonNotAsDescribed' },
  { value: 'damaged', labelKey: 'order.disputeReasonDamaged' },
  { value: 'other', labelKey: 'order.disputeReasonOther' },
];

const ORDER_STEPS: OrderStatus[] = ['payment_pending', 'payment_secured', 'shipped', 'completed'];

const BUYER_FEE_PERCENT = 5;

function getActiveStep(status: OrderStatus): number {
  const idx = ORDER_STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

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
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [shipCourier, setShipCourier] = useState('');
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipSubmitting, setShipSubmitting] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);

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
  const handleShipDialogClose = () => {
    setShipDialogOpen(false);
    setShipCourier('');
    setShipTrackingNumber('');
    setShipError(null);
  };
  const handleMarkShippedSubmit = async () => {
    if (!orderId || !shipCourier.trim() || !shipTrackingNumber.trim()) return;
    setShipSubmitting(true);
    setShipError(null);
    try {
      await dispatch(
        markAsShipped({
          orderId,
          courier: shipCourier.trim(),
          trackingNumber: shipTrackingNumber.trim(),
        })
      ).unwrap();
      handleShipDialogClose();
    } catch (e: any) {
      setShipError(e?.message ?? t('order.markAsShippedError', 'Failed to mark as shipped'));
    } finally {
      setShipSubmitting(false);
    }
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

  const renderStepExplanation = () => {
    if (!currentOrder) return null;
    const currentIndex = getActiveStep(currentOrder.status);
    const totalSteps = ORDER_STEPS.length;

    let currentMessage = '';
    let nextMessage = '';

    switch (currentOrder.status) {
      case 'payment_pending':
        currentMessage = t(
          'order.explain.paymentPending.current',
          'We are confirming your payment for this order.'
        );
        nextMessage = isSeller
          ? t(
              'order.explain.paymentPending.next.seller',
              'Once the payment is secured, you will be able to ship the dress.'
            )
          : t(
              'order.explain.paymentPending.next.buyer',
              'Once the payment is secured, the seller will ship the dress to you.'
            );
        break;
      case 'payment_secured':
        currentMessage = isSeller
          ? t(
              'order.explain.paymentSecured.current.seller',
              'The payment is secured. It is now your turn to ship the dress.'
            )
          : t(
              'order.explain.paymentSecured.current.buyer',
              'Your payment is secured. The seller is preparing to ship your dress.'
            );
        nextMessage = isSeller
          ? t(
              'order.explain.paymentSecured.next.seller',
              'Next, add the courier and tracking number so the buyer can follow the delivery.'
            )
          : t(
              'order.explain.paymentSecured.next.buyer',
              'Next, you will receive a tracking number and the dress will be on its way.'
            );
        break;
      case 'shipped':
        currentMessage = isSeller
          ? t(
              'order.explain.shipped.current.seller',
              'You marked this order as shipped. The buyer can now track the parcel.'
            )
          : t(
              'order.explain.shipped.current.buyer',
              'The dress has been shipped and is on its way to you.'
            );
        nextMessage = isSeller
          ? t(
              'order.explain.shipped.next.seller',
              'Once the buyer confirms delivery (or the protection period ends), you will receive the payout.'
            )
          : t(
              'order.explain.shipped.next.buyer',
              'Next, confirm that you received the dress to release the payout to the seller.'
            );
        break;
      case 'completed':
        currentMessage = t(
          'order.explain.completed.current',
          'This order is completed and the payout has been released.'
        );
        nextMessage = t(
          'order.explain.completed.next',
          'There are no further steps for this order.'
        );
        break;
      case 'cancelled':
        currentMessage = t(
          'order.explain.cancelled.current',
          'This order was cancelled or the payment failed.'
        );
        nextMessage = t(
          'order.explain.cancelled.next',
          'You can start a new order by going back to the listing.'
        );
        break;
      default:
        return null;
    }

    return (
      <Box
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <InfoOutlinedIcon sx={{ color: 'primary.main', mt: 0.4 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('order.stepSummary', 'Step {{current}} of {{total}}', {
              current: currentIndex + 1,
              total: totalSteps,
            })}
          </Typography>
          <Typography variant="body2" color="text.primary">
            {currentMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {nextMessage}
          </Typography>
        </Box>
      </Box>
    );
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

  const isCancelled = currentOrder.status === 'cancelled';
  const activeStep = getActiveStep(currentOrder.status);
  const stepLabels = [
    t('order.stepPayment', 'Payment'),
    t('order.stepSecured', 'Secured'),
    t('order.stepShipped', 'Shipped'),
    t('order.stepCompleted', 'Completed'),
  ];

  return (
    <PageContainer maxWidth="md">
      <SectionHeader
        title={t('order.title', 'Order details')}
        subtitle={t('order.subtitle', 'Track the status of your protected purchase.')}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {isCancelled ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('order.cancelled', 'Payment failed or cancelled')}
        </Alert>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 3,
            borderRadius: 3,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {renderStepExplanation()}
          <Stepper activeStep={activeStep} orientation="vertical">
            {ORDER_STEPS.map((stepStatus, index) => {
              const stepCompleted = index < activeStep || (currentOrder.status === 'completed' && index === ORDER_STEPS.length - 1);
              return (
              <Step key={stepStatus} completed={stepCompleted}>
                <StepLabel
                  StepIconComponent={({ completed, active }) =>
                    completed ? (
                      <CheckCircleRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon
                        sx={{
                          color: active ? 'primary.main' : 'action.disabled',
                          fontSize: 28,
                        }}
                      />
                    )
                  }
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: index <= activeStep ? 600 : 400 }}>
                    {stepLabels[index]}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {index === 0 &&
                      t(
                        'order.stepDesc.payment',
                        'We are confirming the buyer’s card payment for this order.'
                      )}
                    {index === 1 &&
                      t(
                        'order.stepDesc.secured',
                        'The payment is secured in escrow. The seller should now ship the dress.'
                      )}
                    {index === 2 &&
                      t(
                        'order.stepDesc.shipped',
                        'The dress is in transit. The buyer will confirm delivery once it arrives.'
                      )}
                    {index === 3 &&
                      t(
                        'order.stepDesc.completed',
                        'The buyer confirmed delivery and the payout has been released.'
                      )}
                  </Typography>
                </StepContent>
              </Step>
            );})}
          </Stepper>
        </Paper>
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
              {t('order.item', 'Item')}
            </Typography>
            {currentOrder.listing && (
              <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
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
                    src={
                      getAvatarUrl(currentOrder.listing.images[0]) ||
                      currentOrder.listing.images[0]
                    }
                    alt={currentOrder.listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    component={RouterLink}
                    to={`/listings/${currentOrder.listing.id}`}
                    sx={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: 'inherit',
                      display: 'block',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {currentOrder.listing.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {currentOrder.listing.brand} · {currentOrder.listing.size}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {(() => {
                      const totalBgn = currentOrder.priceCents / 100;
                      const subtotalBgn = totalBgn / (1 + BUYER_FEE_PERCENT / 100);
                      const buyerFeeBgn = totalBgn - subtotalBgn;
                      return (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {t('order.subtotal', 'Subtotal')}: {subtotalBgn.toFixed(2)} лв.
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('order.buyerFee', 'Buyer fee (5%)')}: {buyerFeeBgn.toFixed(2)} лв.
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ mt: 0.5, fontWeight: 700, color: 'secondary.main' }}
                          >
                            {t('order.total', 'Total')}: {totalBgn.toFixed(2)} лв.
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              borderColor: 'divider',
              mb: 2,
            }}
          >
            <Typography
              variant="overline"
              sx={{ fontSize: '0.7rem', letterSpacing: 1.2, color: 'text.secondary' }}
            >
              {t('order.shipping', 'Shipping details')}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {currentOrder.shippingFullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentOrder.shippingPhone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentOrder.shippingCity}, {currentOrder.shippingAddressLine}
              </Typography>
            </Box>
            {currentOrder.courier && currentOrder.trackingNumber && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('order.courier', 'Courier')}: {currentOrder.courier}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('order.trackingNumber', 'Tracking number')}: {currentOrder.trackingNumber}
                </Typography>
              </>
            )}
          </Paper>

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
              {t('order.timeline', 'Order timeline')}
            </Typography>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {renderStatusLabel()}
              </Typography>
            </Box>
            {currentOrder.hasOpenDispute && (
              <Alert severity="info" sx={{ mt: 2 }} icon={false}>
                {t('order.disputeOpen', 'You have an open dispute for this order. Our team will review it.')}
              </Alert>
            )}
            {showConfirmButton && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleConfirmReceived}
                  disabled={confirmLoading}
                  fullWidth
                  sx={{ py: 1.25 }}
                >
                  {confirmLoading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    t('order.confirmReceived', 'Confirm item received')
                  )}
                </Button>
              </Box>
            )}
            {canOpenDispute && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleOpenDisputeClick}
                  fullWidth
                >
                  {t('order.openDispute', 'Open dispute')}
                </Button>
              </Box>
            )}
            {isSeller && currentOrder.status === 'payment_secured' && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShipDialogOpen(true)}
                  fullWidth
                  sx={{ py: 1.25 }}
                >
                  {t('order.markAsShippedButton', 'Mark as shipped')}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  {t('order.sellerAwaitingShipment', 'Please mark this order as shipped from your dashboard once you send the dress.')}
                </Typography>
              </Box>
            )}
            {isBuyer && currentOrder.status === 'payment_secured' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('order.nextStepsBuyerSecured', 'Next: the seller will ship the dress. When it arrives, mark it as received to release payment.')}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={disputeDialogOpen}
        onClose={handleDisputeDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          {t('order.openDisputeTitle', 'Open dispute')}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
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
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
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

      <Dialog
        open={shipDialogOpen}
        onClose={handleShipDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          {t('order.markAsShippedTitle', 'Mark order as shipped')}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('order.markAsShippedHint', 'Enter the courier and tracking number so the buyer can follow the delivery.')}
          </Typography>
          <TextField
            fullWidth
            label={t('order.courier', 'Courier')}
            value={shipCourier}
            onChange={(e) => setShipCourier(e.target.value)}
            placeholder="e.g. Econt, Speedy, DPD"
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label={t('order.trackingNumber', 'Tracking number')}
            value={shipTrackingNumber}
            onChange={(e) => setShipTrackingNumber(e.target.value)}
            placeholder="e.g. 1234567890"
            required
          />
          {shipError && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setShipError(null)}>
              {shipError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button onClick={handleShipDialogClose}>{t('common.cancel', 'Cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleMarkShippedSubmit}
            disabled={shipSubmitting || !shipCourier.trim() || !shipTrackingNumber.trim()}
          >
            {shipSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('order.markAsShippedButton', 'Mark as shipped')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default OrderDetails;
