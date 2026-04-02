import { next } from '@vercel/functions';

/** Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in the Vercel project (all relevant environments). */
const REALM = 'TeachAI Case Study';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const prefix = 'basic ';
  const lower = header.slice(0, 6).toLowerCase();
  if (lower !== prefix) return null;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return null;
  }
  const colon = decoded.indexOf(':');
  if (colon === -1) return null;
  return { user: decoded.slice(0, colon), pass: decoded.slice(colon + 1) };
}

export default function middleware(request: Request) {
  const expectedUser = process.env.BASIC_AUTH_USER?.trim();
  const expectedPass = process.env.BASIC_AUTH_PASSWORD?.trim();

  if (!expectedUser || !expectedPass) {
    return new Response('Authentication is not configured.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const creds = parseBasicAuth(request.headers.get('authorization'));
  if (
    creds &&
    timingSafeEqual(creds.user, expectedUser) &&
    timingSafeEqual(creds.pass, expectedPass)
  ) {
    return next();
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}"`,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
