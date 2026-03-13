import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export type NotificationType = 'message' | 'order' | 'stripe' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsState {
  items: AppNotification[];
}

const initialState: NotificationsState = {
  items: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<AppNotification>) {
      const exists = state.items.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    markAsRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    clearNotifications(state) {
      state.items = [];
    },
  },
});

export const { pushNotification, markAsRead, markAllAsRead, clearNotifications } =
  notificationsSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.items.filter((n) => !n.read).length;

export default notificationsSlice.reducer;

