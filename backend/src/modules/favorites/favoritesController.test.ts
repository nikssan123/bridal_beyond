import { Request, Response } from 'express';
import * as favoritesRepo from './favoritesRepository';
import { list, add, remove } from './favoritesController';

jest.mock('./favoritesRepository');

const mockRepo = favoritesRepo as jest.Mocked<typeof favoritesRepo>;

describe('favoritesController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { user: { id: 'user-1', email: 'u@x.com' } };
    mockRes = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), send: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      await list(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
    });

    it('returns favorites from repo', async () => {
      const listings = [{ id: 'l1', title: 'Dress' }] as any[];
      mockRepo.findByUserId.mockResolvedValue(listings);
      await list(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRepo.findByUserId).toHaveBeenCalledWith('user-1');
      expect(mockRes.json).toHaveBeenCalledWith(listings);
    });
  });

  describe('add', () => {
    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      mockReq.params = { listingId: 'l1' };
      await add(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('returns 201 when added', async () => {
      mockReq.params = { listingId: 'l1' };
      mockRepo.add.mockResolvedValue(true);
      await add(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRepo.add).toHaveBeenCalledWith('user-1', 'l1');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ listingId: 'l1' });
    });

    it('calls next(notFound) when listing not found', async () => {
      mockReq.params = { listingId: 'l1' };
      mockRepo.add.mockResolvedValue(false);
      await add(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('remove', () => {
    it('returns 204 after remove', async () => {
      mockReq.params = { listingId: 'l1' };
      await remove(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRepo.remove).toHaveBeenCalledWith('user-1', 'l1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('returns 401 when req.user is missing', async () => {
      mockReq.user = undefined;
      mockReq.params = { listingId: 'l1' };
      await remove(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
