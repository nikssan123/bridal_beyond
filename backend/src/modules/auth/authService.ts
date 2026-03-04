import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';

export interface GoogleTokenPayload {
  email: string;
  sub: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const client = new OAuth2Client(env.googleClientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token: no payload');
  }
  if (!payload.email) {
    throw new Error('Missing email in Google token');
  }
  return {
    email: payload.email,
    sub: payload.sub,
    name: payload.name ?? payload.email.split('@')[0],
    picture: payload.picture,
  };
}

const META_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export interface MetaTokenPayload {
  metaId: string;
  email: string;
  name: string;
  picture?: string | null;
}

export async function verifyMetaAccessToken(userAccessToken: string): Promise<MetaTokenPayload> {
  if (!env.metaAppId || !env.metaAppSecret) {
    throw new Error('Meta OAuth is not configured');
  }
  const appToken = `${env.metaAppId}|${env.metaAppSecret}`;
  const debugUrl = `${META_GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(userAccessToken)}&access_token=${encodeURIComponent(appToken)}`;
  const debugRes = await fetch(debugUrl);
  if (!debugRes.ok) {
    throw new Error('Invalid or expired Meta token');
  }
  const debugData = (await debugRes.json()) as { data?: { is_valid?: boolean; app_id?: string } };
  if (!debugData.data?.is_valid || debugData.data.app_id !== env.metaAppId) {
    throw new Error('Invalid or expired Meta token');
  }
  const meUrl = `${META_GRAPH_BASE}/me?fields=id,name,email,picture&access_token=${encodeURIComponent(userAccessToken)}`;
  const meRes = await fetch(meUrl);
  if (!meRes.ok) {
    throw new Error('Invalid or expired Meta token');
  }
  const me = (await meRes.json()) as { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } };
  if (!me.id || !me.email) {
    throw new Error('Missing email in Meta profile');
  }
  return {
    metaId: me.id,
    email: me.email,
    name: me.name ?? me.email.split('@')[0],
    picture: me.picture?.data?.url ?? null,
  };
}

/**
 * Base64url decode (Meta uses base64url without padding).
 */
function base64UrlDecode(str: string): Buffer {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '===='.slice(0, 4 - pad);
  return Buffer.from(base64, 'base64');
}

/**
 * Parse and verify Meta's signed_request from the Data Deletion Callback.
 * Returns the Facebook user_id (our meta_id) on success.
 * @see https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */
export function parseAndVerifyMetaSignedRequest(signedRequest: string): { userId: string } {
  if (!env.metaAppId || !env.metaAppSecret) {
    throw new Error('Meta OAuth is not configured');
  }
  const parts = signedRequest.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid signed_request format');
  }
  const [encodedSig, payloadEnc] = parts;
  const payloadBuf = base64UrlDecode(payloadEnc);
  const payloadStr = payloadBuf.toString('utf8');
  const expectedSig = crypto.createHmac('sha256', env.metaAppSecret).update(payloadStr).digest();
  const receivedSig = base64UrlDecode(encodedSig);
  if (expectedSig.length !== receivedSig.length || !crypto.timingSafeEqual(expectedSig, receivedSig)) {
    throw new Error('Invalid signed_request signature');
  }
  const payload = JSON.parse(payloadStr) as { user_id?: string };
  if (!payload.user_id || typeof payload.user_id !== 'string') {
    throw new Error('Missing user_id in signed_request');
  }
  return { userId: payload.user_id };
}
