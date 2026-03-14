import { Request, Response } from 'express';
import {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  errorHandler,
} from './errorHandler';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('AppError and helpers', () => {
    it('badRequest creates 400 error with code', () => {
      const err = badRequest('Invalid input', 'VALIDATION');
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Invalid input');
      expect(err.code).toBe('VALIDATION');
    });

    it('unauthorized creates 401 with default message', () => {
      const err = unauthorized();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
      expect(err.code).toBe('UNAUTHORIZED');
    });

    it('unauthorized accepts custom message', () => {
      const err = unauthorized('Invalid token');
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token');
    });

    it('forbidden creates 403', () => {
      const err = forbidden();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });

    it('notFound creates 404', () => {
      const err = notFound('User not found');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('User not found');
      expect(err.code).toBe('NOT_FOUND');
    });
  });

  describe('errorHandler', () => {
    it('sends status and json for AppError', () => {
      const err = badRequest('Bad', 'BAD');
      errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Bad', code: 'BAD' });
    });

    it('sends 500 for generic Error', () => {
      const err = new Error('Something broke');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Something broke',
        code: 'INTERNAL_ERROR',
      });
      consoleSpy.mockRestore();
    });

    it('uses statusCode and code from error if set', () => {
      const err = new Error('Custom') as Error & { statusCode?: number; code?: string };
      err.statusCode = 418;
      err.code = 'TEAPOT';
      errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Custom',
        code: 'TEAPOT',
      });
    });

    it('defaults message to "Internal server error" when empty', () => {
      const err = new Error('');
      errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    });

    it('handles MulterError LIMIT_FILE_SIZE', () => {
      const multer = require('multer');
      const err = new multer.MulterError('LIMIT_FILE_SIZE');
      errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'File too large.',
        code: 'FILE_TOO_LARGE',
      });
    });
  });
});
