jest.mock('../modules/auth/authRepository');

import { Request, Response } from 'express';
import * as authRepository from '../modules/auth/authRepository';
import { requireAdmin } from './requireAdmin';

const mockAuthRepo = authRepository as jest.Mocked<typeof authRepository>;

describe('requireAdmin', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when user is missing', async () => {
    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', async () => {
    (mockReq as any).user = { id: 'user-1' };
    mockAuthRepo.findById.mockResolvedValue({ id: 'user-1', role: 'user' } as any);
    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(mockAuthRepo.findById).toHaveBeenCalledWith('user-1');
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 403 when user not found', async () => {
    (mockReq as any).user = { id: 'user-1' };
    mockAuthRepo.findById.mockResolvedValue(null);
    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('calls next() when user is admin', async () => {
    (mockReq as any).user = { id: 'admin-1' };
    mockAuthRepo.findById.mockResolvedValue({ id: 'admin-1', role: 'admin' } as any);
    await requireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
