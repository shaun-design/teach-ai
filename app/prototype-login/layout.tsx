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
              width: 40,
              height: 40,
              borderRadius: 10,
              background:
                'linear-gradient(145deg, #0e7490 0%, #0891b2 45%, #155e75 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(14, 116, 144, 0.35)',
              flexShrink: 0,
            }}
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3 2 8.5l3 1.64v5.5L12 21l7-5.36v-5.5L22 8.5 12 3Z"
                fill="white"
                fillOpacity={0.95}
              />
              <path
                d="M12 6.2 6.5 9.2v4.2L12 16.5l5.5-3.1V9.2L12 6.2Z"
                fill="#cffafe"
                fillOpacity={0.35}
              />
            </svg>
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 'clamp(17px, 4vw, 20px)',
              letterSpacing: '-0.02em',
              color: '#0c4a6e',
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
