import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import api from '@/api/axios';
import type { Listing } from '@/data/mockData';

interface ListingsState {
  listings: Listing[];
  selectedListing: Listing | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ListingsState = {
  listings: [],
  selectedListing: null,
  status: 'idle',
  error: null,
};

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const f = state.filters;
    const { data } = await api.get<Listing[]>('/listings', {
      params: {
        category: f.category || undefined,
        size: f.size || undefined,
        condition: f.condition || undefined,
        minPrice: f.priceRange[0],
        maxPrice: f.priceRange[1],
        search: f.searchQuery || undefined,
        sortBy: f.sortBy || 'newest',
      },
    });
    return data;
  }
);

export const fetchListingById = createAsyncThunk(
  'listings/fetchListingById',
  async (id: string) => {
    const { data } = await api.get<Listing>(`/listings/${id}`);
    return data;
  }
);

export type CreateListingPayload = Omit<Listing, 'id' | 'createdAt' | 'seller'> & {
  images: string[];
};

export const createListing = createAsyncThunk(
  'listings/createListing',
  async (payload: CreateListingPayload) => {
    const { data } = await api.post<Listing>('/listings', {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      originalPrice: payload.originalPrice,
      category: payload.category,
      size: payload.size,
      condition: payload.condition,
      color: payload.color,
      brand: payload.brand,
      measurements: payload.measurements,
      images: payload.images?.length ? payload.images : ['/placeholder.svg'],
    });
    return data;
  }
);

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    clearSelectedListing(state) {
      state.selectedListing = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchListings.fulfilled, (state, action) => { state.status = 'succeeded'; state.listings = action.payload; })
      .addCase(fetchListings.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(fetchListingById.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchListingById.fulfilled, (state, action) => { state.status = 'succeeded'; state.selectedListing = action.payload; })
      .addCase(fetchListingById.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(createListing.fulfilled, (state, action) => { state.listings.push(action.payload); });
  },
});

export const { clearSelectedListing } = listingsSlice.actions;
export default listingsSlice.reducer;
