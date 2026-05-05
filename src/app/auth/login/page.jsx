'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const { login } = useUser();

  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsVerification) {
          router.push(`/auth/verify?email=${encodeURIComponent(form.email)}&redirect=${encodeURIComponent(redirect)}`);
          return;
        }
        throw new Error(data.message || 'Login failed');
      }
      login(data.token, data.user);
      router.push(redirect);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (typeof window === 'undefined' || !GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true);
          try {
            const res = await fetch(`${API_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            login(data.token, data.user);
            router.push(redirect);
          } catch (e) {
            setErr(e.message);
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.prompt();
    };
    document.head.appendChild(script);
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Sign in</h1>

      {err && <div className="auth-error">{err}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>Email</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com" />
        <label>Password</label>
        <input type="password" required value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="••••••••" />

        <div style={{ textAlign: 'right', marginBottom: 4 }}>
          <Link href={`/auth/forgot-password?email=${encodeURIComponent(form.email)}`}
            style={{ fontSize: 12, color: 'var(--ink-soft)', textDecoration: 'underline' }}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn auth-btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {GOOGLE_CLIENT_ID && (
        <button className="btn-google" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>
      )}

      <p className="auth-switch">No account? <Link href={`/auth/signup?redirect=${encodeURIComponent(redirect)}`}>Create one</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <AnnounceBar />
      <Header />
      <div className="auth-page">
        <Suspense fallback={<div />}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
