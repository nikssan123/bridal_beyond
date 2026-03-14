import { Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from './validateRequest';

describe('validateRequest', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('parses body and calls next() when valid', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const middleware = validateRequest({ body: schema });
    mockReq.body = { name: 'Alice', age: 30 };
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.body).toEqual({ name: 'Alice', age: 30 });
  });

  it('calls next with 400 and VALIDATION_ERROR when body invalid', () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validateRequest({ body: schema });
    mockReq.body = { name: '' };
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    const err = mockNext.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toMatch(/name/);
  });

  it('parses query when query schema provided', () => {
    const schema = z.object({ page: z.string().transform(Number) });
    const middleware = validateRequest({ query: schema });
    mockReq.query = { page: '2' };
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.query).toEqual({ page: 2 });
  });

  it('parses params when params schema provided', () => {
    const schema = z.object({ id: z.string().uuid() });
    const middleware = validateRequest({ params: schema });
    mockReq.params = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });
});
