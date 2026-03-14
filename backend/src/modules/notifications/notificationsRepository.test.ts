jest.mock('../../prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from '../../prisma';
import {
  listForUser,
  createForUser,
  markAsRead,
  markAllAsRead,
} from './notificationsRepository';

const mockPrisma = prisma as unknown as {
  notification: { findMany: jest.Mock; create: jest.Mock; updateMany: jest.Mock };
};

describe('notificationsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listForUser', () => {
    it('returns notifications for user', async () => {
      const notifications = [
        {
          id: 'n1',
          user_id: 'u1',
          type: 'message',
          title: 'New message',
          body: 'Hi',
          href: null,
          read: false,
          created_at: new Date(),
        },
      ] as any[];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);
      const result = await listForUser('u1');
      expect(result).toEqual(notifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { user_id: 'u1' },
        orderBy: { created_at: 'desc' },
        take: 50,
      });
    });
  });

  describe('createForUser', () => {
    it('creates notification and returns it', async () => {
      const created = {
        id: 'n1',
        user_id: 'u1',
        type: 'order',
        title: 'Order shipped',
        body: null,
        href: '/orders/1',
        read: false,
        created_at: new Date(),
      } as any;
      mockPrisma.notification.create.mockResolvedValue(created);
      const result = await createForUser({
        userId: 'u1',
        type: 'order',
        title: 'Order shipped',
        href: '/orders/1',
      });
      expect(result).toEqual(created);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          user_id: 'u1',
          type: 'order',
          title: 'Order shipped',
          body: undefined,
          href: '/orders/1',
        },
      });
    });
  });

  describe('markAsRead', () => {
    it('calls updateMany with user and id', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);
      await markAsRead('u1', 'n1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', user_id: 'u1' },
        data: { read: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread for user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);
      await markAllAsRead('u1');
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { user_id: 'u1', read: false },
        data: { read: true },
      });
    });
  });
});
