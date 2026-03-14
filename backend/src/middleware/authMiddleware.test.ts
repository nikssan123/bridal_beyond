jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));
jest.mock('../config/env', () => ({
  env: { jwtSecret: 'test-secret' },
}));

import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { authMiddleware } from './authMiddleware';

describe('authMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
    (jwt.verify as jest.Mock).mockReset();
  });

  it('calls next(unauthorized) when Authorization header is missing', () => {
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    const err = mockNext.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.message).toMatch(/authorization/i);
  });

  it('calls next(unauthorized) when Authorization does not start with Bearer ', () => {
    mockReq.headers = { authorization: 'Basic x' };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    const err = mockNext.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });

  it('calls next(unauthorized) when token is invalid', () => {
    mockReq.headers = { authorization: 'Bearer bad-token' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('sets req.user and calls next() when token is valid', () => {
    mockReq.headers = { authorization: 'Bearer valid-token' };
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: 'user-123',
      email: 'u@example.com',
      role: 'user',
      name: 'Test User',
    });
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);
    expect((mockReq as any).user).toEqual({
      id: 'user-123',
      email: 'u@example.com',
      role: 'user',
      name: 'Test User',
    });
    expect(mockNext).toHaveBeenCalledWith();
  });
});
