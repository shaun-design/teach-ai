'use client';

import { useSearchParams } from 'next/navigation';
import { useId, useState } from 'react';

function safeRedirectTarget(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) {
    return '/index.html';
  }
  return from;
}

const fieldLabelText: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#64748b',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 16,
  boxSizing: 'border-box',
  background: '#fff',
  color: '#0f172a',
  outline: 'none',
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
          fill="#94a3b8"
        />
        <circle cx="12" cy="12" r="2" fill="#64748b" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3 21 21M10.6 10.6a2 2 0 0 0 2.77 2.77M9.88 9.88A4 4 0 0 1 15.12 15.1M6.34 6.34C4.5 7.56 3.05 9.2 2 11c1.73 3.89 6 7 11 7 1.52 0 2.98-.29 4.32-.8M12 5c-1.52 0-2.98.29-4.31.8m0 0L2 2m7.69 3.8 12.5 12.5"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const from = safeRedirectTarget(searchParams.get('from'));
  const userId = useId();
  const passId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const res = await fetch('/api/prototype-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError('Invalid credentials.');
        return;
      }
      window.location.assign(from);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        width: '100%',
        maxWidth: 420,
        padding: 'clamp(28px, 5vw, 40px)',
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        boxShadow:
          '0 1px 3px rgba(15, 23, 42, 0.06), 0 12px 40px rgba(15, 23, 42, 0.06)',
      }}
    >
      <h1
        style={{
          margin: '0 0 28px',
          fontSize: 'clamp(22px, 5vw, 26px)',
          fontWeight: 700,
          lineHeight: 1.25,
          color: '#0f172a',
          letterSpacing: '-0.02em',
        }}
      >
        Sign in to view the full case study
      </h1>

      <div style={{ marginBottom: 0 }}>
        <label htmlFor={userId} style={{ display: 'block' }}>
          <span style={fieldLabelText}>Username</span>
          <input
            id={userId}
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...inputStyle, display: 'block' }}
          />
        </label>
      </div>

      <div style={{ marginTop: 20 }}>
        <label htmlFor={passId} style={{ display: 'block' }}>
          <span style={fieldLabelText}>Password</span>
          <div style={{ position: 'relative' }}>
          <input
            id={passId}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              ...inputStyle,
              display: 'block',
              paddingRight: 48,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              border: 'none',
              borderRadius: 8,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EyeIcon open={!showPassword} />
          </button>
        </div>
        </label>
      </div>

      {error ? (
        <p
          role="alert"
          style={{ margin: '16px 0 0', fontSize: 14, color: '#dc2626' }}
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          marginTop: 28,
          width: '100%',
          padding: '14px 18px',
          borderRadius: 10,
          border: 'none',
          background: pending ? '#93c5fd' : '#2563eb',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: pending ? 'default' : 'pointer',
          boxShadow: pending ? 'none' : '0 1px 2px rgba(37, 99, 235, 0.25)',
        }}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
