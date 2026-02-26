import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axios';
import type { Listing } from '@/data/mockData';

interface FavoritesState {
  listingIds: string[];
  favoriteListings: Listing[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: FavoritesState = {
  listingIds: [],
  favoriteListings: [],
  status: 'idle',
  error: null,
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<Listing[]>('/favorites');
      return data;
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (e as Error)?.message
        || 'Failed to load favorites';
      return rejectWithValue(message);
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (listingId: string, { rejectWithValue }) => {
    try {
      await api.post(`/favorites/${listingId}`);
      return listingId;
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (e as Error)?.message
        || 'Failed to add favorite';
      return rejectWithValue(message);
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (listingId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/favorites/${listingId}`);
      return listingId;
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        || (e as Error)?.message
        || 'Failed to remove favorite';
      return rejectWithValue(message);
    }
  }
);

export function toggleFavorite(listingId: string) {
  return async (dispatch: import('@reduxjs/toolkit').ThunkDispatch<any, any, any>, getState: () => { favorites: FavoritesState }) => {
    const { listingIds } = getState().favorites;
    if (listingIds.includes(listingId)) {
      await dispatch(removeFavorite(listingId));
    } else {
      await dispatch(addFavorite(listingId));
    }
  };
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.favoriteListings = action.payload;
        state.listingIds = action.payload.map((l) => l.id);
        state.error = null;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || action.error.message || null;
      })
      .addCase(addFavorite.fulfilled, (state, action) => {
        const id = action.payload;
        if (!state.listingIds.includes(id)) {
          state.listingIds.push(id);
        }
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        const id = action.payload;
        state.listingIds = state.listingIds.filter((x) => x !== id);
        state.favoriteListings = state.favoriteListings.filter((l) => l.id !== id);
      });
  },
});

export default favoritesSlice.reducer;
