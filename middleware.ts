import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Prototype gate — middleware layer.
 *
 * Intentionally NO local imports and NO crypto.
 * Vercel Edge middleware has historically failed when project-local modules are
 * bundled into it, and async crypto operations add unnecessary complexity here.
 *
 * This file only does the fast-path redirect for unauthenticated users.
 * The full HMAC token verification happens in `app/layout.tsx` (server component),
 * which runs on every request that reaches Next.js — that is the real security gate.
 */

const SESSION_COOKIE = 'prototype_session';

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/prototype-login' ||
    pathname.startsWith('/api/prototype-auth') ||
    pathname === '/logout'
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always forward the pathname — app/layout.tsx reads x-prototype-pathname to
  // decide whether to run the auth check. Without this header on public paths,
  // the layout sees '' instead of '/prototype-login' and redirects again → loop.
  function pass() {
    const h = new Headers(request.headers);
    h.set('x-prototype-pathname', pathname);
    return NextResponse.next({ request: { headers: h } });
  }

  if (isPublicPath(pathname)) {
    return pass();
  }

  // No session cookie → fast redirect to login.
  // Even if someone sets a fake cookie, app/layout.tsx will reject it.
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/prototype-login';
    url.searchParams.set('from', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  return pass();
}

export const config = {
  // Exclude _next internal routes, favicon, robots, sitemap, and common static assets.
  matcher: [
    '/((?!_next/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|map)).*)',
  ],
};
