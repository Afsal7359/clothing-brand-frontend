'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const redirect = searchParams.get('redirect') || '/account';
  const { login } = useUser();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/, '').slice(0, 1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { setErr('Enter the 6-digit code'); return; }
    setErr('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification failed');
      login(data.token, data.user);
      router.push(redirect);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch { /* ignore */ }
  };

  return (
    <div className="auth-box">
      <h1 className="auth-title">Verify email</h1>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, textAlign: 'center' }}>
        Enter the 6-digit code sent to <strong>{email}</strong>
      </p>
      {err && <div className="auth-error">{err}</div>}
      {resent && <div className="auth-success">New code sent!</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="otp-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="otp-input"
            />
          ))}
        </div>
        <button type="submit" className="btn auth-btn" disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <button className="auth-link-btn" onClick={handleResend} style={{ marginTop: 16 }}>
        Didn't receive a code? Resend
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <>
      <Header />
      <div className="auth-page">
        <Suspense fallback={<div />}>
          <VerifyForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
