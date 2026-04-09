import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware must not import local project modules (no @/, no ./lib/).
 * Vercel Edge flags those as unsupported; keep auth checks self-contained here.
 * Cookie name + token format must stay aligned with `prototype-session-core.ts`.
 */
const PROTOTYPE_SESSION_COOKIE = 'prototype_session';

function requirePrototypeEnv():
  | { user: string; password: string; secret: string }
  | null {
  const user = process.env.PROTOTYPE_AUTH_USER?.trim();
  const password = process.env.PROTOTYPE_AUTH_PASSWORD?.trim();
  const secret = process.env.PROTOTYPE_AUTH_SECRET?.trim();
  if (!user || !password || !secret) return null;
  return { user, password, secret };
}

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

function base64UrlToUint8(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifySessionToken(
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

function isPublicPath(pathname: string): boolean {
  if (pathname === '/prototype-login') return true;
  if (pathname.startsWith('/api/prototype-auth')) return true;
  if (pathname === '/logout') return true;
  return false;
}

function withPathnameHeader(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-prototype-pathname', pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export async function middleware(request: NextRequest) {
  const env = requirePrototypeEnv();
  if (!env) {
    return new NextResponse(
      [
        'Prototype authentication is not configured.',
        '',
        'On Vercel: Project → Settings → Environment Variables',
        'Add PROTOTYPE_AUTH_USER, PROTOTYPE_AUTH_PASSWORD, PROTOTYPE_AUTH_SECRET',
        '(non-empty values; enable for Production and Preview).',
        'Then redeploy — .env.local is not used on Vercel.',
      ].join('\n'),
      {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );
  }

  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return withPathnameHeader(request, pathname);
  }

  const token = request.cookies.get(PROTOTYPE_SESSION_COOKIE)?.value;
  const ok = await verifySessionToken(token, env.secret);
  if (!ok) {
    const url = request.nextUrl.clone();
    url.pathname = '/prototype-login';
    url.searchParams.set('from', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return withPathnameHeader(request, pathname);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
