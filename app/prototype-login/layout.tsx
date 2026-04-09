import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

/**
 * Minimal chrome: brand header, centered content, copyright — no main nav / footer / chat.
 */
export default function PrototypeLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={inter.className}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(180deg, #dbeafe 0%, #eff6ff 38%, #f8fafc 72%, #ffffff 100%)',
        color: '#0f172a',
      }}
    >
      <header
        style={{
          padding: 'clamp(16px, 4vw, 28px) clamp(20px, 5vw, 40px) 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background:
                'linear-gradient(155deg, #004a56 0%, #005f72 48%, #003844 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0, 30, 40, 0.45)',
              flexShrink: 0,
            }}
            aria-hidden
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path fill="#fff" d="M3.2 19.8L8 15l2.1 2.1-4.8 4.8-1.4-1.4-.7-.7z"/>
              <path fill="#fff" d="M8.2 15L11 4.5l1.3 1.3L9.5 14.2 8.2 15z" opacity=".92"/>
              <path fill="#fff" d="M17.5 3.5l1.1 3.2L22 7.5l-3.4 1.2-1.1 3.4-1.1-3.4-3.4-1.2 3.4-1.2 1.1-3.2z"/>
            </svg>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: '#007890',
            }}
          >
            TeachAI
          </span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px)',
        }}
      >
        {children}
      </main>

      <footer
        style={{
          padding: '20px 16px 28px',
          textAlign: 'center',
          fontSize: 13,
          color: '#94a3b8',
        }}
      >
        © {new Date().getFullYear()} Shaun Herron. All rights reserved.
      </footer>
    </div>
  );
}
