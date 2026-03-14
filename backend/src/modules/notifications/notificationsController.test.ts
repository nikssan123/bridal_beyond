import { Request, Response } from 'express';
import * as notificationsRepo from './notificationsRepository';
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from './notificationsController';

jest.mock('./notificationsRepository');

const mockRepo = notificationsRepo as jest.Mocked<typeof notificationsRepo>;

describe('notificationsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { user: { id: 'user-1', email: 'u@x.com' } };
    mockRes = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    jest.clearAllMocks();
  });

  describe('listMyNotifications', () => {
    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      await listMyNotifications(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('returns mapped notifications', async () => {
      const items = [
        {
          id: 'n1',
          type: 'message',
          title: 'New message',
          body: 'Hi',
          href: '/messages',
          read: false,
          created_at: new Date('2024-01-01'),
        },
      ] as any[];
      mockRepo.listForUser.mockResolvedValue(items);
      await listMyNotifications(mockReq as Request, mockRes as Response);
      expect(mockRepo.listForUser).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith([
        {
          id: 'n1',
          type: 'message',
          title: 'New message',
          body: 'Hi',
          href: '/messages',
          read: false,
          createdAt: expect.any(String),
        },
      ]);
    });
  });

  describe('markNotificationRead', () => {
    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      mockReq.params = {};
      await markNotificationRead(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when id is missing', async () => {
      mockReq.params = {};
      await markNotificationRead(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('calls repo and returns 204', async () => {
      mockReq.params = { id: 'n1' };
      mockRepo.markAsRead.mockResolvedValue();
      await markNotificationRead(mockReq as Request, mockRes as Response);
      expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-1', 'n1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  describe('markAllNotificationsRead', () => {
    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      await markAllNotificationsRead(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('calls repo and returns 204', async () => {
      mockRepo.markAllAsRead.mockResolvedValue();
      await markAllNotificationsRead(mockReq as Request, mockRes as Response);
      expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });
});
