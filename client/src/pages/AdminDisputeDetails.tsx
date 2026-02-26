import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  TextField,
} from '@mui/material';
import PageContainer from '@/components/PageContainer';
import SectionHeader from '@/components/SectionHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchDisputeById,
  resolveDispute,
  clearCurrent,
  type AdminDispute,
} from '@/features/admin/disputesSlice';

const AdminDisputeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { current, detailStatus, resolveStatus, error } = useAppSelector(
    (state) => state.adminDisputes
  );
  const [resolveNotes, setResolveNotes] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchDisputeById(id));
    }
    return () => {
      dispatch(clearCurrent());
    };
  }, [dispatch, id]);

  const handleResolve = (outcome: 'buyer_refund' | 'seller_payout' | 'no_refund' | 'partial_refund') => {
    if (!id) return;
    const refundAmountCents =
      outcome === 'partial_refund' && partialAmount.trim()
        ? Math.round(parseFloat(partialAmount) * 100)
        : undefined;
    if (outcome === 'partial_refund' && (!refundAmountCents || refundAmountCents <= 0)) {
      return;
    }
    dispatch(
      resolveDispute({
        id,
        outcome,
        refundAmountCents,
        notes: resolveNotes.trim() || undefined,
      })
    ).then((result) => {
      if (resolveDispute.fulfilled.match(result)) {
        setResolveNotes('');
        setPartialAmount('');
      }
    });
  };

  const isOpen = current?.status === 'open';
  const isPreCapture = current?.order?.status === 'shipped';

  if (!id || detailStatus === 'loading' || !current) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  const order = current.order;

  return (
    <PageContainer maxWidth="md">
      <SectionHeader
        title="Dispute details"
        subtitle={`Dispute ${current.id.slice(0, 8)}…`}
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Dispute
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {current.status}
            </Typography>
            <Typography variant="body2">
              <strong>Type:</strong> {current.type ?? '–'}
            </Typography>
            <Typography variant="body2">
              <strong>Reason:</strong> {current.reason}
            </Typography>
            {current.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Description:</strong> {current.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Created: {new Date(current.created_at).toLocaleString()}
            </Typography>
            {current.resolved_at && (
              <Typography variant="body2" color="text.secondary">
                Resolved: {new Date(current.resolved_at).toLocaleString()}
              </Typography>
            )}
            {current.resolution_notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Resolution notes:</strong> {current.resolution_notes}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Order
            </Typography>
            {order ? (
              <>
                <Typography variant="body2">
                  <strong>Order ID:</strong> {order.id}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {order.status}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> {(order.price_cents / 100).toFixed(2)} (cents: {order.price_cents})
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Intent:</strong> {order.payment_intent_id}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Buyer:</strong> {order.buyer?.name} ({order.buyer?.email})
                </Typography>
                <Typography variant="body2">
                  <strong>Seller:</strong> {order.seller?.name} ({order.seller?.email})
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Shipping:</strong> {order.shipping_full_name}, {order.shipping_city},{' '}
                  {order.shipping_address_line}
                </Typography>
                {order.listing && (
                  <Typography variant="body2">
                    <strong>Listing:</strong> {order.listing.title}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No order data.
              </Typography>
            )}
          </Paper>
        </Grid>
        {isOpen && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Resolve dispute
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Resolution notes (optional)"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                sx={{ mb: 2 }}
              />
              {isPreCapture && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Pre-capture: payment not yet captured. You can release funds to seller or cancel (refund buyer).
                </Typography>
              )}
              {!isPreCapture && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Post-capture: payment already captured. You can refund buyer (full or partial).
                </Typography>
              )}
              {!isPreCapture && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Partial refund amount (BGN)"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="e.g. 50"
                    sx={{ mr: 2, width: 160 }}
                  />
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={resolveStatus === 'loading'}
                    onClick={() => handleResolve('partial_refund')}
                  >
                    Partial refund
                  </Button>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(isPreCapture ? ['seller_payout', 'buyer_refund'] : ['buyer_refund', 'no_refund']).map(
                  (outcome) => (
                    <Button
                      key={outcome}
                      variant="contained"
                      disabled={resolveStatus === 'loading'}
                      onClick={() =>
                        handleResolve(
                          outcome as 'buyer_refund' | 'seller_payout' | 'no_refund' | 'partial_refund'
                        )
                      }
                    >
                      {resolveStatus === 'loading' ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : outcome === 'seller_payout' ? (
                        'Release funds to seller'
                      ) : outcome === 'buyer_refund' ? (
                        'Refund buyer'
                      ) : outcome === 'no_refund' ? (
                        'No refund (close dispute)'
                      ) : (
                        outcome
                      )}
                    </Button>
                  )
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/admin/disputes')}>
          Back to list
        </Button>
      </Box>
    </PageContainer>
  );
};

export default AdminDisputeDetails;
