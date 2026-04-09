import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PROTOTYPE_SESSION_COOKIE,
  requirePrototypeEnv,
  verifySessionToken,
} from './lib/prototype-session';

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
