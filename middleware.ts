import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware must not import local project modules — Vercel Edge rejects them.
 * All session / crypto logic is inlined here.
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
  // Wrap everything — any crypto failure must not propagate to the middleware handler.
  try {
    if (!token) return false;
    const dot = token.indexOf('.');
    if (dot === -1) return false;

    const payload = base64UrlToUint8(token.slice(0, dot));
    const sig = base64UrlToUint8(token.slice(dot + 1));

    const exp = Number(new TextDecoder().decode(payload));
    if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return false;

    const rawBytes = new TextEncoder().encode(secret);
    const raw = rawBytes.buffer.slice(rawBytes.byteOffset, rawBytes.byteOffset + rawBytes.byteLength) as ArrayBuffer;
    const key = await crypto.subtle.importKey(
      'raw',
      raw,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const expected = new Uint8Array(
      await crypto.subtle.sign('HMAC', key, payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength) as ArrayBuffer),
    );

    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= expected[i]! ^ sig[i]!;
    return diff === 0;
  } catch {
    return false;
  }
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/prototype-login' ||
    pathname.startsWith('/api/prototype-auth') ||
    pathname === '/logout'
  );
}

export async function middleware(request: NextRequest) {
  // Top-level guard: never let an uncaught exception escape to Vercel Edge.
  try {
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

    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-prototype-pathname', pathname);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const token = request.cookies.get(PROTOTYPE_SESSION_COOKIE)?.value;
    const ok = await verifySessionToken(token, env.secret);

    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/prototype-login';
      url.searchParams.set('from', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-prototype-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    // If something unexpected throws, fail open with a plain 500 rather than
    // letting Vercel emit an opaque MIDDLEWARE_INVOCATION_FAILED.
    return new NextResponse('Middleware error.', { status: 500 });
  }
}

export const config = {
  // Exclude _next/* (all sub-paths), static file extensions, and favicon.
  // Keep it simple: only protect actual page/API paths.
  matcher: [
    '/((?!_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|otf|map)).*)',
  ],
};
