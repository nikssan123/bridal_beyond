import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import api from '@/api/axios';
import type { Listing } from '@/data/mockData';

const PAGE_SIZE = 12;

interface ListResponse {
  listings: Listing[];
  total: number;
  maxPrice: number;
}

interface ListingsState {
  listings: Listing[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  selectedListing: Listing | null;
  profileListings: Listing[];
  profileListingsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  maxPrice: number;
  featured: Listing[];
  featuredStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: ListingsState = {
  listings: [],
  total: 0,
  hasMore: false,
  loadingMore: false,
  selectedListing: null,
  profileListings: [],
  profileListingsStatus: 'idle',
  status: 'idle',
  error: null,
  // default max price (EUR) used before backend value arrives
  maxPrice: 0,
   featured: [],
   featuredStatus: 'idle',
};

export const fetchListings = createAsyncThunk(
  'listings/fetchListings',
  async (payload: { append?: boolean }, { getState }) => {
    const state = getState() as RootState;
    const f = state.filters;
    const append = payload?.append ?? false;
    const offset = append ? state.listings.listings.length : 0;
    const { data } = await api.get<ListResponse>('/listings', {
      params: {
        category: f.category || undefined,
        size: f.size || undefined,
        condition: f.condition || undefined,
        minPrice: f.priceRange[0],
        maxPrice: f.priceRange[1],
        search: f.searchQuery || undefined,
        sortBy: f.sortBy || 'newest',
        limit: PAGE_SIZE,
        offset,
      },
    });
    return { ...data, append };
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

export const updateListing = createAsyncThunk(
  'listings/updateListing',
  async (payload: { id: string; data: CreateListingPayload }) => {
    const { id, data: body } = payload;
    const { data } = await api.put<Listing>(`/listings/${id}`, {
      title: body.title,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      category: body.category,
      size: body.size,
      condition: body.condition,
      color: body.color,
      brand: body.brand,
      measurements: body.measurements,
      images: body.images?.length ? body.images : ['/placeholder.svg'],
    });
    return data;
  }
);

export const deleteListing = createAsyncThunk(
  'listings/deleteListing',
  async (id: string) => {
    await api.delete(`/listings/${id}`);
    return id;
  }
);

export const uploadListingImage = createAsyncThunk(
  'listings/uploadListingImage',
  async (file: File, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post<{ url: string }>('/listings/upload-image', formData, {
      timeout: 120000,
    });
    return data.url;
  }
);

export const fetchListingsBySeller = createAsyncThunk(
  'listings/fetchListingsBySeller',
  async (params: { sellerId: string; status?: string }) => {
    const { data } = await api.get<ListResponse>('/listings', {
      params: { sellerId: params.sellerId, status: params.status || undefined, limit: 100 },
    });
    return data.listings;
  }
);

export const fetchFeaturedListings = createAsyncThunk(
  'listings/fetchFeaturedListings',
  async () => {
    const { data } = await api.get<ListResponse>('/listings', {
      params: { featured: 'true', limit: 3 },
    });
    return data.listings;
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
      .addCase(fetchListings.pending, (state, action) => {
        const append = action.meta.arg?.append ?? false;
        if (append) {
          state.loadingMore = true;
        } else {
          state.status = 'loading';
          state.error = null;
          state.listings = [];
        }
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        const { listings, total, maxPrice, append } = action.payload;
        if (append) {
          state.listings.push(...listings);
          state.loadingMore = false;
        } else {
          state.listings = listings;
          state.status = 'succeeded';
        }
        state.total = total;
        state.hasMore = state.listings.length < total;
         state.maxPrice = maxPrice ?? state.maxPrice;
        state.error = null;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        const append = action.meta.arg?.append ?? false;
        if (append) {
          state.loadingMore = false;
        } else {
          state.status = 'failed';
          state.error = action.error.message || null;
        }
      })
      .addCase(fetchListingById.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchListingById.fulfilled, (state, action) => { state.status = 'succeeded'; state.selectedListing = action.payload; })
      .addCase(fetchListingById.rejected, (state, action) => { state.status = 'failed'; state.error = action.error.message || null; })
      .addCase(createListing.fulfilled, (state, action) => {
        state.listings.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateListing.fulfilled, (state, action) => {
        const updated = action.payload;
        state.selectedListing = updated;
        state.listings = state.listings.map((l) => (l.id === updated.id ? updated : l));
        state.profileListings = state.profileListings.map((l) => (l.id === updated.id ? updated : l));
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        const id = action.payload;
        state.listings = state.listings.filter((l) => l.id !== id);
        state.profileListings = state.profileListings.filter((l) => l.id !== id);
        if (state.selectedListing?.id === id) {
          state.selectedListing = null;
        }
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(fetchListingsBySeller.pending, (state) => { state.profileListingsStatus = 'loading'; })
      .addCase(fetchListingsBySeller.fulfilled, (state, action) => {
        state.profileListingsStatus = 'succeeded';
        state.profileListings = action.payload;
      })
      .addCase(fetchListingsBySeller.rejected, (state) => { state.profileListingsStatus = 'failed'; });
      builder
        .addCase(fetchFeaturedListings.pending, (state) => {
          state.featuredStatus = 'loading';
        })
        .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
          state.featuredStatus = 'succeeded';
          state.featured = action.payload;
        })
        .addCase(fetchFeaturedListings.rejected, (state) => {
          state.featuredStatus = 'failed';
          state.featured = [];
        });
  },
});

export const { clearSelectedListing } = listingsSlice.actions;
export default listingsSlice.reducer;
