jest.mock('../../config/env', () => ({
  env: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '7d',
  },
}));

import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from './jwt';

describe('jwt', () => {
  describe('signToken', () => {
    it('returns a JWT string with sub, email, role', () => {
      const token = signToken({
        sub: 'user-1',
        email: 'u@example.com',
        role: 'user',
      });
      expect(typeof token).toBe('string');
      const decoded = jwt.decode(token) as { sub?: string; email?: string; role?: string };
      expect(decoded.sub).toBe('user-1');
      expect(decoded.email).toBe('u@example.com');
      expect(decoded.role).toBe('user');
    });

    it('defaults role to user when not provided', () => {
      const token = signToken({ sub: 'x', email: 'x@x.com' });
      const decoded = jwt.decode(token) as { role?: string };
      expect(decoded.role).toBe('user');
    });
  });

  describe('verifyToken', () => {
    it('returns payload for valid token', () => {
      const token = signToken({
        sub: 'user-1',
        email: 'u@example.com',
        role: 'admin',
      });
      const payload = verifyToken(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('u@example.com');
      expect(payload.role).toBe('admin');
    });

    it('throws for invalid token', () => {
      expect(() => verifyToken('invalid')).toThrow();
    });

    it('throws for token signed with wrong secret', () => {
      const wrongToken = jwt.sign(
        { sub: '1', email: 'a@b.com', role: 'user' },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      expect(() => verifyToken(wrongToken)).toThrow();
    });
  });
});
