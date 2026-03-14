import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer, {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
} from './favoritesSlice';

const mockListings = [
  { id: '1', title: 'A', description: '', price: 100, originalPrice: 100, category: 'wedding' as const, size: 'S', condition: 'new' as const, color: '', brand: '', measurements: { bust: '', waist: '', hips: '', length: '' }, images: [], seller: { id: 's1', name: 'S', avatar: '', rating: 5, listings: 1, location: '', memberSince: '' }, createdAt: '' },
  { id: '2', title: 'B', description: '', price: 200, originalPrice: 200, category: 'wedding' as const, size: 'M', condition: 'like-new' as const, color: '', brand: '', measurements: { bust: '', waist: '', hips: '', length: '' }, images: [], seller: { id: 's1', name: 'S', avatar: '', rating: 5, listings: 1, location: '', memberSince: '' }, createdAt: '' },
];

const mockApi = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/api/axios', () => ({ default: mockApi }));

function createStore() {
  return configureStore({ reducer: { favorites: favoritesReducer } });
}

describe('favoritesSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFavorites', () => {
    it('pending sets status loading', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));
      const store = createStore();
      store.dispatch(fetchFavorites());
      expect(store.getState().favorites.status).toBe('loading');
    });

    it('fulfilled sets listings and listingIds', async () => {
      mockApi.get.mockResolvedValue({ data: mockListings });
      const store = createStore();
      await store.dispatch(fetchFavorites());
      const state = store.getState().favorites;
      expect(state.status).toBe('succeeded');
      expect(state.favoriteListings).toEqual(mockListings);
      expect(state.listingIds).toEqual(['1', '2']);
    });

    it('rejected sets status failed and error', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));
      const store = createStore();
      await store.dispatch(fetchFavorites());
      const state = store.getState().favorites;
      expect(state.status).toBe('failed');
      expect(state.error).toBe('Network error');
    });
  });

  describe('addFavorite', () => {
    it('fulfilled adds id to listingIds', async () => {
      mockApi.post.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(addFavorite('3'));
      expect(store.getState().favorites.listingIds).toContain('3');
    });

    it('fulfilled does not duplicate id', async () => {
      mockApi.post.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(fetchFavorites.fulfilled(mockListings));
      await store.dispatch(addFavorite('1'));
      expect(store.getState().favorites.listingIds.filter((id: string) => id === '1')).toHaveLength(1);
    });
  });

  describe('removeFavorite', () => {
    it('fulfilled removes id from listingIds and favoriteListings', async () => {
      const store = createStore();
      await store.dispatch(fetchFavorites.fulfilled(mockListings));
      await store.dispatch(removeFavorite.fulfilled('1', 'requestId', '1'));
      const state = store.getState().favorites;
      expect(state.listingIds).toEqual(['2']);
      expect(state.favoriteListings).toHaveLength(1);
      expect(state.favoriteListings[0].id).toBe('2');
    });
  });

  describe('toggleFavorite', () => {
    it('dispatches removeFavorite when already in list', async () => {
      mockApi.delete.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(fetchFavorites.fulfilled(mockListings));
      await store.dispatch(toggleFavorite('1') as any);
      expect(mockApi.delete).toHaveBeenCalledWith('/favorites/1');
    });

    it('dispatches addFavorite when not in list', async () => {
      mockApi.post.mockResolvedValue({});
      const store = createStore();
      await store.dispatch(toggleFavorite('99') as any);
      expect(mockApi.post).toHaveBeenCalledWith('/favorites/99');
    });
  });
});
