jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('../config/env', () => ({ env: { jwtSecret: 'test-secret' } }));

import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { optionalAuthMiddleware } from './optionalAuthMiddleware';

describe('optionalAuthMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
    (jwt.verify as jest.Mock).mockReset();
  });

  it('calls next() without setting user when no Authorization header', () => {
    optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as any).user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('calls next() without setting user when token invalid', () => {
    mockReq.headers = { authorization: 'Bearer bad' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });
    optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as any).user).toBeUndefined();
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('sets req.user and calls next() when token valid', () => {
    mockReq.headers = { authorization: 'Bearer valid' };
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'u1',
      email: 'u@x.com',
      role: 'user',
      name: 'User',
    });
    optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as any).user).toEqual({
      id: 'u1',
      email: 'u@x.com',
      role: 'user',
      name: 'User',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });
});
