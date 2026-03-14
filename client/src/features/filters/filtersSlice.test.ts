import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import filtersReducer, {
  setCategory,
  setSize,
  setCondition,
  setPriceRange,
  setSortBy,
  setSearchQuery,
  resetFilters,
} from './filtersSlice';

function createStore() {
  return configureStore({ reducer: { filters: filtersReducer } });
}

describe('filtersSlice', () => {
  it('setCategory updates category', () => {
    const store = createStore();
    store.dispatch(setCategory('wedding'));
    expect(store.getState().filters.category).toBe('wedding');
  });

  it('setSize updates size', () => {
    const store = createStore();
    store.dispatch(setSize('M'));
    expect(store.getState().filters.size).toBe('M');
  });

  it('setCondition updates condition', () => {
    const store = createStore();
    store.dispatch(setCondition('like-new'));
    expect(store.getState().filters.condition).toBe('like-new');
  });

  it('setPriceRange updates priceRange', () => {
    const store = createStore();
    store.dispatch(setPriceRange([100, 500]));
    expect(store.getState().filters.priceRange).toEqual([100, 500]);
  });

  it('setSortBy updates sortBy', () => {
    const store = createStore();
    store.dispatch(setSortBy('price-asc'));
    expect(store.getState().filters.sortBy).toBe('price-asc');
  });

  it('setSearchQuery updates searchQuery', () => {
    const store = createStore();
    store.dispatch(setSearchQuery('dress'));
    expect(store.getState().filters.searchQuery).toBe('dress');
  });

  it('resetFilters restores initialState', () => {
    const store = createStore();
    store.dispatch(setCategory('wedding'));
    store.dispatch(setSearchQuery('x'));
    store.dispatch(resetFilters());
    const state = store.getState().filters;
    expect(state.category).toBe('');
    expect(state.searchQuery).toBe('');
    expect(state.priceRange).toEqual([0, 5000]);
    expect(state.sortBy).toBe('newest');
  });
});
