'use client';

import { FormEvent, useState } from 'react';
import { LockKeyhole, Utensils } from 'lucide-react';

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'تعذّر تسجيل الدخول.');
      window.location.assign(returnTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذّر تسجيل الدخول.');
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-mark"><Utensils size={28} /></span>
        <p className="login-eyebrow">ذائقتي</p>
        <h1 id="login-title">سجّل دخولك</h1>
        <p className="login-copy">ادخل لدفتر مطاعمك وتقييماتك المحفوظة.</p>
        <form onSubmit={submit} className="login-form">
          <label>
            <span>اسم المستخدم</span>
            <input
              required
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="اسم المستخدم"
            />
          </label>
          <label>
            <span>كلمة المرور</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="كلمة المرور"
            />
          </label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" disabled={submitting}>
            <LockKeyhole size={18} />
            {submitting ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </section>
    </main>
  );
}
