import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  category: string;
  size: string;
  condition: string;
  priceRange: [number, number];
  sortBy: string;
  searchQuery: string;
}

const initialState: FiltersState = {
  category: '',
  size: '',
  condition: '',
  priceRange: [0, 5000],
  sortBy: 'newest',
  searchQuery: '',
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategory(state, action: PayloadAction<string>) { state.category = action.payload; },
    setSize(state, action: PayloadAction<string>) { state.size = action.payload; },
    setCondition(state, action: PayloadAction<string>) { state.condition = action.payload; },
    setPriceRange(state, action: PayloadAction<[number, number]>) { state.priceRange = action.payload; },
    setSortBy(state, action: PayloadAction<string>) { state.sortBy = action.payload; },
    setSearchQuery(state, action: PayloadAction<string>) { state.searchQuery = action.payload; },
    resetFilters() { return initialState; },
  },
});

export const { setCategory, setSize, setCondition, setPriceRange, setSortBy, setSearchQuery, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
