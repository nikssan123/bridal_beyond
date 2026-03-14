import crypto from 'crypto';

jest.mock('../../config/env', () => ({
  env: {
    googleClientId: 'google-client-id',
    metaAppId: 'meta-app-id',
    metaAppSecret: 'meta-app-secret',
  },
}));

import { parseAndVerifyMetaSignedRequest } from './authService';

function makeSignedRequest(payload: { user_id: string }, secret: string): string {
  const payloadStr = JSON.stringify(payload);
  const payloadEnc = Buffer.from(payloadStr, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const sig = crypto.createHmac('sha256', secret).update(payloadStr).digest();
  const sigEnc = sig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${sigEnc}.${payloadEnc}`;
}

describe('authService', () => {
  describe('parseAndVerifyMetaSignedRequest', () => {
    it('returns userId when signature is valid', () => {
      const signedRequest = makeSignedRequest({ user_id: 'fb-user-123' }, 'meta-app-secret');
      const result = parseAndVerifyMetaSignedRequest(signedRequest);
      expect(result).toEqual({ userId: 'fb-user-123' });
    });

    it('throws when signed_request has wrong number of parts', () => {
      expect(() => parseAndVerifyMetaSignedRequest('only-one-part')).toThrow(
        'Invalid signed_request format'
      );
      expect(() => parseAndVerifyMetaSignedRequest('a.b.c')).toThrow(
        'Invalid signed_request format'
      );
    });

    it('throws when signature is invalid', () => {
      const signedRequest = makeSignedRequest({ user_id: 'fb-user-123' }, 'wrong-secret');
      expect(() => parseAndVerifyMetaSignedRequest(signedRequest)).toThrow(
        'Invalid signed_request signature'
      );
    });

    it('throws when payload has no user_id', () => {
      const payloadStr = JSON.stringify({});
      const payloadEnc = Buffer.from(payloadStr, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      const sig = crypto
        .createHmac('sha256', 'meta-app-secret')
        .update(payloadStr)
        .digest();
      const sigEnc = sig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const signedRequest = `${sigEnc}.${payloadEnc}`;
      expect(() => parseAndVerifyMetaSignedRequest(signedRequest)).toThrow(
        'Missing user_id in signed_request'
      );
    });
  });
});
