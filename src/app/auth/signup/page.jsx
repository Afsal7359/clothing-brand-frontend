'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      router.push(`/auth/verify?email=${encodeURIComponent(form.email)}&redirect=${encodeURIComponent(redirect)}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Create account</h1>
      {err && <div className="auth-error">{err}</div>}
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
      <AnnounceBar />
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
