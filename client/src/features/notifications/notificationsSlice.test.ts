import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import notificationsReducer, {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  pushNotification,
  markAsRead,
  selectNotifications,
  selectUnreadCount,
} from './notificationsSlice';
import type { AppNotification } from './notificationsSlice';

const mockApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/api/axios', () => ({ default: mockApi }));

const mockNotifications: AppNotification[] = [
  { id: 'n1', type: 'message', title: 'New message', createdAt: '', read: false },
  { id: 'n2', type: 'order', title: 'Order update', createdAt: '', read: true },
];

function createStore() {
  return configureStore({ reducer: { notifications: notificationsReducer } });
}

describe('notificationsSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('reducers', () => {
    it('pushNotification adds item if not exists', () => {
      const store = createStore();
      store.dispatch(pushNotification(mockNotifications[0]));
      expect(store.getState().notifications.items).toHaveLength(1);
      store.dispatch(pushNotification({ ...mockNotifications[0], id: 'n2' }));
      expect(store.getState().notifications.items).toHaveLength(2);
    });

    it('pushNotification does not duplicate same id', () => {
      const store = createStore();
      store.dispatch(pushNotification(mockNotifications[0]));
      store.dispatch(pushNotification(mockNotifications[0]));
      expect(store.getState().notifications.items).toHaveLength(1);
    });

    it('markAsRead sets read true', () => {
      const store = createStore();
      store.dispatch(pushNotification(mockNotifications[0]));
      store.dispatch(markAsRead('n1'));
      expect(store.getState().notifications.items[0].read).toBe(true);
    });
  });

  describe('markAllNotificationsRead', () => {
    it('fulfilled sets all items read', () => {
      const store = createStore();
      store.dispatch(fetchNotifications.fulfilled(mockNotifications));
      store.dispatch(markAllNotificationsRead.fulfilled(undefined, 'req', undefined));
      expect(store.getState().notifications.items.every((n) => n.read)).toBe(true);
    });
  });

  describe('fetchNotifications', () => {
    it('fulfilled replaces items', async () => {
      mockApi.get.mockResolvedValue({ data: mockNotifications });
      const store = createStore();
      await store.dispatch(fetchNotifications());
      expect(store.getState().notifications.items).toEqual(mockNotifications);
    });
  });

  describe('markNotificationRead', () => {
    it('fulfilled marks item read', async () => {
      const store = createStore();
      store.dispatch(fetchNotifications.fulfilled(mockNotifications));
      await store.dispatch(markNotificationRead.fulfilled(undefined, 'req', 'n1'));
      expect(store.getState().notifications.items.find((n) => n.id === 'n1')?.read).toBe(true);
    });
  });

  describe('selectors', () => {
    it('selectNotifications returns items', () => {
      const store = createStore();
      store.dispatch(fetchNotifications.fulfilled(mockNotifications));
      const state = store.getState() as RootState;
      expect(selectNotifications(state)).toEqual(mockNotifications);
    });

    it('selectUnreadCount returns count of unread', () => {
      const store = createStore();
      store.dispatch(fetchNotifications.fulfilled(mockNotifications));
      const state = store.getState() as RootState;
      expect(selectUnreadCount(state)).toBe(1);
    });
  });
});
