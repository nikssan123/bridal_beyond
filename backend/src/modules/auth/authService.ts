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
