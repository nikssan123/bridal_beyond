import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '../modules/admin/adminController';
import { authMiddleware } from './authMiddleware';
import { requireAdmin } from './requireAdmin';

/**
 * Allows access if either:
 * - X-Admin-Token header is valid (portal login), or
 * - JWT is present and user has role admin (app login).
 */
export function adminOrRequireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.header('x-admin-token');
  if (verifyAdminToken(token)) {
    next();
    return;
  }
  authMiddleware(req, res, (err?: any) => {
    if (err) return next(err);
    requireAdmin(req, res, next);
  });
}
