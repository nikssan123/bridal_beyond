import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { useTranslation } from 'react-i18next';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  clientSecret: string;
  paymentIntentId?: string;
  onSuccess?: () => void;
}

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

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  clientSecret,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (e: StripeCardElementChangeEvent) => {
    setCardComplete(e.complete);
    setError(e.error?.message ?? null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setSubmitting(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setSubmitting(false);
        return;
      }
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });
      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed');
        setSubmitting(false);
        return;
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error)?.message ?? 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pay with card</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ py: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your card details. Your payment will be authorized and held until the seller confirms delivery.
            </Typography>
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.default',
              }}
            >
              <CardElement options={cardElementOptions} onChange={handleCardChange} />
            </Box>
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submitting}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!stripe || !cardComplete || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : t('checkout.authorizePayment', 'Authorize payment')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentDialog;
