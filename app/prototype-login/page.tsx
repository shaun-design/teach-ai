import { Suspense } from 'react';
import { LoginForm } from './login-form';

export default function PrototypeLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100%',
            maxWidth: 360,
            padding: 28,
            color: '#6b7f7c',
            fontSize: 14,
          }}
        >
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
