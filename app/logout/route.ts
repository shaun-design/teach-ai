import { NextResponse } from 'next/server';
import { PROTOTYPE_SESSION_COOKIE, clearSessionCookieOptions } from '@/lib/prototype-session';

/** Bookmark-friendly logout for the prototype gate (clears session cookie). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = NextResponse.redirect(new URL('/prototype-login', url.origin));
  res.cookies.set(PROTOTYPE_SESSION_COOKIE, '', clearSessionCookieOptions());
  return res;
}
