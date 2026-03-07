import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

export interface SellerProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  listings: number;
  location: string;
  memberSince: string;
  isVerified: boolean;
  hasPaymentSetup: boolean;
}

interface SellersState {
  currentSeller: SellerProfile | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SellersState = {
  currentSeller: null,
  status: 'idle',
  error: null,
};

export const fetchSellerProfile = createAsyncThunk(
  'sellers/fetchProfile',
  async (sellerId: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SellerProfile>(`/sellers/${sellerId}`);
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const message = e?.response?.data?.message ?? e?.message ?? 'Failed to load seller';
      return rejectWithValue(message);
    }
  }
);

const sellersSlice = createSlice({
  name: 'sellers',
  initialState,
  reducers: {
    clearCurrentSeller(state) {
      state.currentSeller = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.currentSeller = null;
      })
      .addCase(fetchSellerProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentSeller = action.payload;
        state.error = null;
      })
      .addCase(fetchSellerProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.currentSeller = null;
        state.error = (action.payload as string) ?? action.error.message ?? 'Failed to load seller';
      });
  },
});

export const { clearCurrentSeller } = sellersSlice.actions;
export default sellersSlice.reducer;
