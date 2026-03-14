import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reviewsReducer, {
  fetchReviewsBySellerId,
  addReview,
} from './reviewsSlice';

const mockApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/api/axios', () => ({ default: mockApi }));

const mockReviews = [
  { id: 'r1', sellerId: 's1', userName: 'U1', rating: 5, comment: 'Great', createdAt: '' },
];

function createStore() {
  return configureStore({ reducer: { reviews: reviewsReducer } });
}

describe('reviewsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchReviewsBySellerId', () => {
    it('pending sets status loading', () => {
      mockApi.get.mockImplementation(() => new Promise(() => {}));
      const store = createStore();
      store.dispatch(fetchReviewsBySellerId('s1'));
      expect(store.getState().reviews.status).toBe('loading');
    });

    it('fulfilled stores reviews by sellerId', async () => {
      mockApi.get.mockResolvedValue({ data: mockReviews });
      const store = createStore();
      await store.dispatch(fetchReviewsBySellerId('s1'));
      expect(store.getState().reviews.reviewsBySeller['s1']).toEqual(mockReviews);
      expect(store.getState().reviews.status).toBe('succeeded');
    });

    it('rejected sets status failed', async () => {
      mockApi.get.mockRejectedValue(new Error('Failed'));
      const store = createStore();
      await store.dispatch(fetchReviewsBySellerId('s1'));
      expect(store.getState().reviews.status).toBe('failed');
      expect(store.getState().reviews.error).toBeTruthy();
    });
  });

  describe('addReview', () => {
    it('fulfilled appends review to seller list', async () => {
      const store = createStore();
      await store.dispatch(fetchReviewsBySellerId.fulfilled({ sellerId: 's1', reviews: mockReviews }, 'req', 's1'));
      const newReview = { id: 'r2', sellerId: 's1', userName: 'U2', rating: 4, comment: 'Good', createdAt: '' };
      mockApi.post.mockResolvedValue({ data: newReview });
      await store.dispatch(addReview({ sellerId: 's1', rating: 4, comment: 'Good' }));
      expect(store.getState().reviews.reviewsBySeller['s1']).toHaveLength(2);
      expect(store.getState().reviews.reviewsBySeller['s1'][1]).toEqual(newReview);
    });

    it('fulfilled creates array for new seller', async () => {
      const newReview = { id: 'r1', sellerId: 's2', userName: 'U', rating: 5, comment: '', createdAt: '' };
      mockApi.post.mockResolvedValue({ data: newReview });
      const store = createStore();
      await store.dispatch(addReview({ sellerId: 's2', rating: 5 }));
      expect(store.getState().reviews.reviewsBySeller['s2']).toEqual([newReview]);
    });
  });
});
