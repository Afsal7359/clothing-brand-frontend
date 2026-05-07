'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const { login } = useUser();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const googleDivRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === 'undefined') return;
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true); setErr('');
          try {
            const res = await fetch(`${API_URL}/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
            login(data.token, data.user);
            router.push(redirect);
          } catch (e) { setErr(e.message); } finally { setLoading(false); }
        },
      });
      if (googleDivRef.current) {
        window.google.accounts.id.renderButton(googleDivRef.current, {
          type: 'standard', theme: 'outline', size: 'large',
          text: 'signup_with', shape: 'rectangular', width: 380,
        });
      }
    };
    if (window.google?.accounts) {
      initGoogle();
    } else if (!document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true; s.defer = true; s.onload = initGoogle;
      document.head.appendChild(s);
    } else {
      const t = setInterval(() => { if (window.google?.accounts) { clearInterval(t); initGoogle(); } }, 100);
      setTimeout(() => clearInterval(t), 5000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      router.push(`/auth/verify?email=${encodeURIComponent(form.email)}&redirect=${encodeURIComponent(redirect)}`);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Create account</h1>
      {err && <div className="auth-error">{err}</div>}

      {GOOGLE_CLIENT_ID && (
        <>
          <div ref={googleDivRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 18px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>Name</label>
        <input type="text" value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name" />
        <label>Email</label>
        <input type="email" required value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@example.com" />
        <label>Password</label>
        <input type="password" required minLength={8} value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Min. 8 characters" />
        <button type="submit" className="btn auth-btn" disabled={loading}>
          {loading ? 'Sending OTP…' : 'Continue'}
        </button>
      </form>

      <p className="auth-switch">Already have an account? <Link href={`/auth/login?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link></p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <>
      <Header />
      <div className="auth-page">
        <Suspense fallback={<div />}>
          <SignupForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
