import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

interface StripeState {
  connectStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  connectError: string | null;
  accountStatus: { hasRequirementsDue: boolean; currentlyDue: string[] } | null;
  accountStatusLoading: boolean;
}

const initialState: StripeState = {
  connectStatus: 'idle',
  connectError: null,
  accountStatus: null,
  accountStatusLoading: false,
};

export const connectStripe = createAsyncThunk(
  'stripe/connect',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ onboardingUrl: string }>('/stripe/connect');
      return data.onboardingUrl;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Failed to connect Stripe';
      return rejectWithValue(message);
    }
  }
);

export const openStripeAccount = createAsyncThunk(
  'stripe/openAccount',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post<{ accountLinkUrl: string }>('/stripe/account-link');
      return data.accountLinkUrl;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Failed to open Stripe account';
      return rejectWithValue(message);
    }
  }
);

export const fetchStripeAccountStatus = createAsyncThunk(
  'stripe/fetchAccountStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ hasRequirementsDue: boolean; currentlyDue: string[] }>(
        '/stripe/account-status'
      );
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Failed to load account status';
      return rejectWithValue(message);
    }
  }
);

const stripeSlice = createSlice({
  name: 'stripe',
  initialState,
  reducers: {
    clearConnectError(state) {
      state.connectError = null;
      state.connectStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectStripe.pending, (state) => {
        state.connectStatus = 'loading';
        state.connectError = null;
      })
      .addCase(connectStripe.fulfilled, (state) => {
        state.connectStatus = 'succeeded';
        state.connectError = null;
      })
      .addCase(connectStripe.rejected, (state, action) => {
        state.connectStatus = 'failed';
        state.connectError = (action.payload as string) ?? 'Failed to connect Stripe';
      })
      .addCase(openStripeAccount.pending, (state) => {
        state.connectStatus = 'loading';
        state.connectError = null;
      })
      .addCase(openStripeAccount.fulfilled, (state) => {
        state.connectStatus = 'succeeded';
        state.connectError = null;
      })
      .addCase(openStripeAccount.rejected, (state, action) => {
        state.connectStatus = 'failed';
        state.connectError = (action.payload as string) ?? 'Failed to open Stripe account';
      })
      .addCase(fetchStripeAccountStatus.pending, (state) => {
        state.accountStatusLoading = true;
      })
      .addCase(fetchStripeAccountStatus.fulfilled, (state, action) => {
        state.accountStatus = action.payload;
        state.accountStatusLoading = false;
      })
      .addCase(fetchStripeAccountStatus.rejected, (state) => {
        state.accountStatus = null;
        state.accountStatusLoading = false;
      });
  },
});

export const { clearConnectError } = stripeSlice.actions;
export default stripeSlice.reducer;
