import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';

export type ShopStatus = 'pending' | 'approved' | 'rejected';

export interface ShopSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
  status: ShopStatus;
  listingsCount: number;
  createdAt: string;
}

export interface ShopReviewSummary {
  averageRating: number;
  count: number;
}

export interface ShopProfile extends ShopSummary {
  ownerName: string;
  ownerId: string;
  reviewSummary?: ShopReviewSummary;
}

/** Shop review item (same shape as seller review for ReviewList compatibility) */
export interface ShopReviewItem {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ShopsState {
  shops: ShopSummary[];
  shopsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  currentShop: ShopProfile | null;
  currentShopStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  shopReviewsByShop: Record<string, ShopReviewItem[]>;
  shopReviewsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  myShop: ShopProfile | null;
  myShopStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ShopsState = {
  shops: [],
  shopsStatus: 'idle',
  currentShop: null,
  currentShopStatus: 'idle',
  shopReviewsByShop: {},
  shopReviewsStatus: 'idle',
  myShop: null,
  myShopStatus: 'idle',
  error: null,
};

export const fetchShops = createAsyncThunk(
  'shops/fetchShops',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ shops: ShopSummary[] }>('/shops', { params: { limit: 50 } });
      return data.shops;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to load shops');
    }
  }
);

export const fetchShopProfile = createAsyncThunk(
  'shops/fetchShopProfile',
  async (idOrSlug: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ShopProfile>(`/shops/${encodeURIComponent(idOrSlug)}`);
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to load shop');
    }
  }
);

export const fetchShopReviews = createAsyncThunk(
  'shops/fetchShopReviews',
  async (idOrSlug: string, { rejectWithValue }) => {
    try {
      const { data } = await api.get<{ shopId: string; reviews: ShopReviewItem[] }>(
        `/shops/${encodeURIComponent(idOrSlug)}/reviews`
      );
      return { shopId: data.shopId, reviews: data.reviews };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to load reviews');
    }
  }
);

export const addShopReview = createAsyncThunk(
  'shops/addShopReview',
  async (
    { idOrSlug, rating, comment }: { idOrSlug: string; rating: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<{ shopId: string; review: ShopReviewItem }>(
        `/shops/${encodeURIComponent(idOrSlug)}/reviews`,
        { rating, comment: comment ?? '' }
      );
      return { shopId: data.shopId, review: data.review };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to add review');
    }
  }
);

export const fetchMyShop = createAsyncThunk(
  'shops/fetchMyShop',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<ShopProfile | null>('/shops/me');
      return data ?? null;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (e?.response?.status === 404) return rejectWithValue(null);
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to load shop');
    }
  }
);

export const uploadShopLogo = createAsyncThunk(
  'shops/uploadShopLogo',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const { data } = await api.post<{ logoUrl: string }>('/shops/logo', formData);
      return data.logoUrl;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Upload failed');
    }
  }
);

export const enlistShop = createAsyncThunk(
  'shops/enlistShop',
  async (payload: { name: string; slug?: string; description?: string; address?: string; logoUrl?: string }, { rejectWithValue }) => {
    try {
      const { data } = await api.post<ShopSummary>('/shops', payload);
      return data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Failed to create shop');
    }
  }
);

const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    clearCurrentShop(state) {
      state.currentShop = null;
      state.currentShopStatus = 'idle';
      state.error = null;
    },
    clearMyShop(state) {
      state.myShop = null;
      state.myShopStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending, (state) => {
        state.shopsStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchShops.fulfilled, (state, action) => {
        state.shopsStatus = 'succeeded';
        state.shops = action.payload;
        state.error = null;
      })
      .addCase(fetchShops.rejected, (state, action) => {
        state.shopsStatus = 'failed';
        state.shops = [];
        state.error = (action.payload as string) ?? null;
      })
      .addCase(fetchShopProfile.pending, (state) => {
        state.currentShopStatus = 'loading';
        state.currentShop = null;
        state.error = null;
      })
      .addCase(fetchShopProfile.fulfilled, (state, action) => {
        state.currentShopStatus = 'succeeded';
        state.currentShop = action.payload;
        state.error = null;
      })
      .addCase(fetchShopProfile.rejected, (state, action) => {
        state.currentShopStatus = 'failed';
        state.currentShop = null;
        state.error = (action.payload as string) ?? null;
      })
      .addCase(fetchShopReviews.pending, (state) => {
        state.shopReviewsStatus = 'loading';
      })
      .addCase(fetchShopReviews.fulfilled, (state, action) => {
        state.shopReviewsStatus = 'succeeded';
        state.shopReviewsByShop[action.payload.shopId] = action.payload.reviews;
      })
      .addCase(fetchShopReviews.rejected, (state) => {
        state.shopReviewsStatus = 'failed';
      })
      .addCase(addShopReview.fulfilled, (state, action) => {
        const { shopId, review } = action.payload;
        if (!state.shopReviewsByShop[shopId]) state.shopReviewsByShop[shopId] = [];
        state.shopReviewsByShop[shopId] = [review, ...state.shopReviewsByShop[shopId]];
        if (state.currentShop?.id === shopId) {
          const s = state.currentShop.reviewSummary ?? { averageRating: 0, count: 0 };
          const newCount = s.count + 1;
          state.currentShop.reviewSummary = {
            count: newCount,
            averageRating: (s.averageRating * s.count + review.rating) / newCount,
          };
        }
      })
      .addCase(fetchMyShop.pending, (state) => {
        state.myShopStatus = 'loading';
      })
      .addCase(fetchMyShop.fulfilled, (state, action) => {
        state.myShopStatus = 'succeeded';
        state.myShop = action.payload;
      })
      .addCase(fetchMyShop.rejected, (state, action) => {
        state.myShopStatus = 'failed';
        state.myShop = null;
      })
      .addCase(enlistShop.fulfilled, (state, action) => {
        state.myShop = { ...action.payload, ownerName: '', ownerId: '' } as ShopProfile;
        state.myShopStatus = 'succeeded';
      });
  },
});

export const { clearCurrentShop, clearMyShop } = shopsSlice.actions;
export default shopsSlice.reducer;
