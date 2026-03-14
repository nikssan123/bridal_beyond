jest.mock('../modules/admin/adminController', () => ({
  verifyAdminToken: jest.fn(),
}));
jest.mock('./authMiddleware', () => ({ authMiddleware: jest.fn() }));
jest.mock('./requireAdmin', () => ({ requireAdmin: jest.fn() }));

import { Request, Response } from 'express';
import * as adminController from '../modules/admin/adminController';
import * as authMiddleware from './authMiddleware';
import * as requireAdmin from './requireAdmin';
import { adminOrRequireAdmin } from './adminOrRequireAdmin';

describe('adminOrRequireAdmin', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { header: jest.fn(), headers: {} };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('calls next() when x-admin-token is valid', () => {
    (mockReq.header as jest.Mock).mockReturnValue('valid-admin-token');
    (adminController.verifyAdminToken as jest.Mock).mockReturnValue(true);
    adminOrRequireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(adminController.verifyAdminToken).toHaveBeenCalledWith('valid-admin-token');
    expect(mockNext).toHaveBeenCalledWith();
    expect(authMiddleware.authMiddleware).not.toHaveBeenCalled();
  });

  it('calls authMiddleware when x-admin-token is missing', () => {
    (mockReq.header as jest.Mock).mockReturnValue(undefined);
    (adminController.verifyAdminToken as jest.Mock).mockReturnValue(false);
    (authMiddleware.authMiddleware as jest.Mock).mockImplementation((_r: any, _res: any, cb: (err?: any) => void) => cb());
    (requireAdmin.requireAdmin as jest.Mock).mockImplementation((_r: any, _res: any, cb: () => void) => cb());
    adminOrRequireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(authMiddleware.authMiddleware).toHaveBeenCalled();
  });

  it('calls authMiddleware when x-admin-token is invalid', () => {
    (mockReq.header as jest.Mock).mockReturnValue('bad');
    (adminController.verifyAdminToken as jest.Mock).mockReturnValue(false);
    (authMiddleware.authMiddleware as jest.Mock).mockImplementation((_r: any, _res: any, cb: (err?: any) => void) => cb());
    (requireAdmin.requireAdmin as jest.Mock).mockImplementation((_r: any, _res: any, cb: () => void) => cb());
    adminOrRequireAdmin(mockReq as Request, mockRes as Response, mockNext);
    expect(requireAdmin.requireAdmin).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith();
  });
});
