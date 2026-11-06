import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const ACCESS_TTL = '15m';
const REFRESH_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export type AccessPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new Error('Invalid access token');
  }
  return {
    sub: decoded.sub,
    email: typeof decoded.email === 'string' ? decoded.email : '',
  };
}

export function generateRefreshToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(48).toString('base64url');
  return {
    raw,
    hash: hashRefreshToken(raw),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  };
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
