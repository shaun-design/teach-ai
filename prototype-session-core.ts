/**
 * Prototype gate session helpers — Node.js runtime only (API routes + layout).
 * Uses the synchronous Node.js `crypto` module, NOT Web Crypto / crypto.subtle.
 * Middleware does NOT import this file; it only does a cookie-presence check.
 */

import { createHmac, timingSafeEqual as nodeTimingSafeEqual } from 'crypto';

export const PROTOTYPE_SESSION_COOKIE = 'prototype_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = String(exp);
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  try {
    if (!token) return false;
    const dot = token.indexOf('.');
    if (dot === -1) return false;

    const payloadB64 = token.slice(0, dot);
    const sigGiven = token.slice(dot + 1);

    let payload: string;
    try {
      payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    } catch {
      return false;
    }

    const exp = Number(payload);
    if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return false;

    const sigExpected = createHmac('sha256', secret).update(payload).digest('base64url');
    if (sigGiven.length !== sigExpected.length) return false;

    return nodeTimingSafeEqual(Buffer.from(sigGiven), Buffer.from(sigExpected));
  } catch {
    return false;
  }
}

export function requirePrototypeEnv():
  | { user: string; password: string; secret: string }
  | null {
  const user = process.env.PROTOTYPE_AUTH_USER?.trim();
  const password = process.env.PROTOTYPE_AUTH_PASSWORD?.trim();
  const secret = process.env.PROTOTYPE_AUTH_SECRET?.trim();
  if (!user || !password || !secret) return null;
  return { user, password, secret };
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}
