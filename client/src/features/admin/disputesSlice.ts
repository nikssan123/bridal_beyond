import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/api/axios';

export type DisputeStatus = 'open' | 'resolved_buyer' | 'resolved_seller' | 'cancelled';

export interface AdminDisputeOrder {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price_cents: number;
  platform_fee_cents: number;
  payment_intent_id: string;
  status: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_city: string;
  shipping_address_line: string;
  courier?: string | null;
  tracking_number?: string | null;
  created_at: string;
  updated_at: string;
  listing?: { id: string; title: string; price: string; [key: string]: unknown };
  buyer?: { id: string; name: string; email: string };
  seller?: { id: string; name: string; email: string };
}

export interface AdminDispute {
  id: string;
  order_id: string;
  buyer_id: string;
  status: DisputeStatus;
  reason: string;
  description: string | null;
  type: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  order?: AdminDisputeOrder;
  buyer?: { id: string; name: string; email: string };
}

export const fetchDisputes = createAsyncThunk(
  'adminDisputes/fetchDisputes',
  async (params: { status?: string } | void, { rejectWithValue }) => {
    try {
      const status = params?.status;
      const url = status ? `/admin/disputes?status=${encodeURIComponent(status)}` : '/admin/disputes';
      const { data } = await api.get<AdminDispute[]>(url);
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load disputes';
      return rejectWithValue(message);
    }
  }
);

export const fetchDisputeById = createAsyncThunk(
  'adminDisputes/fetchDisputeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<AdminDispute>(`/admin/disputes/${id}`);
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load dispute';
      return rejectWithValue(message);
    }
  }
);

export const resolveDispute = createAsyncThunk(
  'adminDisputes/resolveDispute',
  async (
    payload: {
      id: string;
      outcome: 'buyer_refund' | 'seller_payout' | 'no_refund' | 'partial_refund';
      refundAmountCents?: number;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<AdminDispute>(
        `/admin/disputes/${payload.id}/resolve`,
        {
          outcome: payload.outcome,
          refundAmountCents: payload.refundAmountCents,
          notes: payload.notes,
        }
      );
      return data;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to resolve dispute';
      return rejectWithValue(message);
    }
  }
);

interface AdminDisputesState {
  list: AdminDispute[];
  current: AdminDispute | null;
  listStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  resolveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AdminDisputesState = {
  list: [],
  current: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  resolveStatus: 'idle',
  error: null,
};

const adminDisputesSlice = createSlice({
  name: 'adminDisputes',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.detailStatus = 'idle';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisputes.pending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchDisputes.fulfilled, (state, action: PayloadAction<AdminDispute[]>) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchDisputes.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load disputes';
      })
      .addCase(fetchDisputeById.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchDisputeById.fulfilled, (state, action: PayloadAction<AdminDispute>) => {
        state.detailStatus = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchDisputeById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to load dispute';
        state.current = null;
      })
      .addCase(resolveDispute.pending, (state) => {
        state.resolveStatus = 'loading';
        state.error = null;
      })
      .addCase(resolveDispute.fulfilled, (state, action: PayloadAction<AdminDispute>) => {
        state.resolveStatus = 'succeeded';
        state.current = action.payload;
        state.list = state.list.map((d) => (d.id === action.payload.id ? action.payload : d));
      })
      .addCase(resolveDispute.rejected, (state, action) => {
        state.resolveStatus = 'failed';
        state.error = (action.payload as string) || 'Failed to resolve dispute';
      });
  },
});

export const { clearCurrent, clearError } = adminDisputesSlice.actions;
export default adminDisputesSlice.reducer;
