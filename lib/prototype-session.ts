/** Signed session cookie for env-based prototype gate (not production identity). */

export const PROTOTYPE_SESSION_COOKIE = 'prototype_session';

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw',
    raw as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function uint8ToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = new TextEncoder().encode(String(exp));
  const key = await importHmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, payload as BufferSource),
  );
  return `${uint8ToBase64Url(payload)}.${uint8ToBase64Url(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  let payload: Uint8Array;
  let sig: Uint8Array;
  try {
    payload = base64UrlToUint8(payloadB64);
    sig = base64UrlToUint8(sigB64);
  } catch {
    return false;
  }
  const exp = Number(new TextDecoder().decode(payload));
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return false;

  const key = await importHmacKey(secret);
  const expected = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, payload as BufferSource),
  );
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected[i]! ^ sig[i]!;
  return diff === 0;
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
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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
