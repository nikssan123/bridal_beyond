import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';
import type { Review } from '@/data/mockData';

interface ReviewsState {
  reviewsBySeller: Record<string, Review[]>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ReviewsState = {
  reviewsBySeller: {},
  status: 'idle',
  error: null,
};

export const fetchReviewsBySellerId = createAsyncThunk(
  'reviews/fetchBySeller',
  async (sellerId: string) => {
    const { data } = await api.get<Review[]>(`/sellers/${sellerId}/reviews`);
    return { sellerId, reviews: data };
  }
);

export const addReview = createAsyncThunk(
  'reviews/addReview',
  async (payload: { sellerId: string; rating: number; comment?: string }) => {
    const { data } = await api.post<Review>(`/sellers/${payload.sellerId}/reviews`, {
      rating: payload.rating,
      comment: payload.comment ?? '',
    });
    return data;
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsBySellerId.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchReviewsBySellerId.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.reviewsBySeller[action.payload.sellerId] = action.payload.reviews;
      })
      .addCase(fetchReviewsBySellerId.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(addReview.fulfilled, (state, action) => {
        const { sellerId } = action.payload;
        if (!state.reviewsBySeller[sellerId]) state.reviewsBySeller[sellerId] = [];
        state.reviewsBySeller[sellerId].push(action.payload);
      });
  },
});

export default reviewsSlice.reducer;
