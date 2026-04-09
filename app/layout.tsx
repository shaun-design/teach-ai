import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  PROTOTYPE_SESSION_COOKIE,
  requirePrototypeEnv,
  verifySessionToken,
} from '@/lib/prototype-session';

export const metadata: Metadata = {
  title: 'TeachAI — Case Study',
  description: 'TeachAI product design case study and prototypes.',
};

function isLayoutPublicPath(pathname: string): boolean {
  if (pathname === '/prototype-login') return true;
  if (pathname.startsWith('/api/prototype-auth')) return true;
  if (pathname === '/logout') return true;
  return false;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get('x-prototype-pathname') ?? '';
  const env = requirePrototypeEnv();

  if (!env) {
    return (
      <html lang="en">
        <body style={{ fontFamily: 'system-ui, sans-serif', padding: 24, lineHeight: 1.6 }}>
          <strong>Prototype authentication is not configured.</strong>
          <p>
            In the Vercel dashboard: <strong>Project → Settings → Environment Variables</strong>.
            Add <code>PROTOTYPE_AUTH_USER</code>, <code>PROTOTYPE_AUTH_PASSWORD</code>, and{' '}
            <code>PROTOTYPE_AUTH_SECRET</code> (for Production and Preview), then{' '}
            <strong>Redeploy</strong>. Local <code>.env.local</code> is not used in production.
          </p>
        </body>
      </html>
    );
  }

  if (!isLayoutPublicPath(pathname)) {
    const token = (await cookies()).get(PROTOTYPE_SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token, env.secret))) {
      redirect('/prototype-login');
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Nunito', system-ui, sans-serif" }}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
