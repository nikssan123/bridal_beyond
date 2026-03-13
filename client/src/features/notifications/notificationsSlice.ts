import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import api from '@/api/axios';

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

export const fetchNotifications = createAsyncThunk<AppNotification[]>(
  'notifications/fetchAll',
  async () => {
    const res = await api.get<AppNotification[]>('/notifications/me');
    return res.data;
  }
);

export const markAllNotificationsRead = createAsyncThunk<void>(
  'notifications/markAllRead',
  async () => {
    await api.post('/notifications/me/mark-all-read');
  }
);

export const markNotificationRead = createAsyncThunk<void, string>(
  'notifications/markOneRead',
  async (id: string) => {
    await api.post(`/notifications/${id}/read`);
  }
);

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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.items.forEach((n) => {
        n.read = true;
      });
    });
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const item = state.items.find((n) => n.id === action.meta.arg);
      if (item) item.read = true;
    });
  },
});

export const { pushNotification, markAsRead } = notificationsSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.items.filter((n) => !n.read).length;

export default notificationsSlice.reducer;

