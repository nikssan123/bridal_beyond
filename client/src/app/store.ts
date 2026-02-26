import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import listingsReducer from '../features/listings/listingsSlice';
import reviewsReducer from '../features/reviews/reviewsSlice';
import filtersReducer from '../features/filters/filtersSlice';
import favoritesReducer from '../features/favorites/favoritesSlice';
import conversationsReducer from '../features/conversations/conversationsSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import stripeReducer from '../features/stripe/stripeSlice';
import ordersReducer from '../features/orders/ordersSlice';
import adminDisputesReducer from '../features/admin/disputesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingsReducer,
    reviews: reviewsReducer,
    filters: filtersReducer,
    favorites: favoritesReducer,
    conversations: conversationsReducer,
    payments: paymentsReducer,
    stripe: stripeReducer,
    orders: ordersReducer,
    adminDisputes: adminDisputesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
