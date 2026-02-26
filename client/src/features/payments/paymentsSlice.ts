import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

export interface CurrentPayment {
  clientSecret: string;
  paymentIntentId: string;
}

interface PaymentsState {
  currentPayment: CurrentPayment | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: PaymentsState = {
  currentPayment: null,
  status: 'idle',
  error: null,
};

export const createPaymentIntent = createAsyncThunk(
  'payments/createIntent',
  async (listingId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ clientSecret: string; paymentIntentId: string }>(
        '/payments/create-intent',
        { listingId }
      );
      return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Failed to create payment';
      return rejectWithValue(message);
    }
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearCurrentPayment(state) {
      state.currentPayment = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPaymentIntent.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentPayment = action.payload;
        state.error = null;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Failed to create payment';
        state.currentPayment = null;
      });
  },
});

export const { clearCurrentPayment } = paymentsSlice.actions;
export default paymentsSlice.reducer;
