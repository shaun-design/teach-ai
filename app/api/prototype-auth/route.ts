import { NextResponse } from 'next/server';
import {
  createSessionToken,
  requirePrototypeEnv,
  timingSafeEqualStr,
  PROTOTYPE_SESSION_COOKIE,
  sessionCookieOptions,
  clearSessionCookieOptions,
} from '@/lib/prototype-session';

export async function POST(request: Request) {
  const env = requirePrototypeEnv();
  if (!env) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  if (rec.action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(PROTOTYPE_SESSION_COOKIE, '', clearSessionCookieOptions());
    return res;
  }

  const username = typeof rec.username === 'string' ? rec.username : '';
  const password = typeof rec.password === 'string' ? rec.password : '';

  if (
    !timingSafeEqualStr(username, env.user) ||
    !timingSafeEqualStr(password, env.password)
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await createSessionToken(env.secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PROTOTYPE_SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
