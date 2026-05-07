'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

function ForgotForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();

  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'reset') inputRefs.current[0]?.focus();
  }, [step]);

  /* ── Step 1: send OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
      setStep('reset');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input handlers ── */
  const handleDigit = (i, val) => {
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
    if (text.length === 6) { setDigits(text.split('')); inputRefs.current[5]?.focus(); }
  };

  /* ── Step 2: verify OTP + set new password ── */
  const handleReset = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) { setErr('Enter the 6-digit code'); return; }
    if (password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Auto-login after reset
      login(data.token, data.user);
      router.push('/account');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <div className="auth-box">
        <h1 className="auth-title">Forgot password</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, textAlign: 'center' }}>
          Enter your account email. We'll send a reset code.
        </p>
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={handleSendOtp} className="auth-form">
          <label>Email</label>
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" />
          <button type="submit" className="btn auth-btn" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
        <p className="auth-switch"><Link href="/auth/login">← Back to sign in</Link></p>
      </div>
    );
  }

  return (
    <div className="auth-box">
      <h1 className="auth-title">Reset password</h1>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24, textAlign: 'center' }}>
        Enter the 6-digit code sent to <strong>{email}</strong> and choose a new password.
      </p>
      {err && <div className="auth-error">{err}</div>}

      <form onSubmit={handleReset} className="auth-form">
        <label>Code from email</label>
        <div className="otp-inputs" onPaste={handlePaste} style={{ marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="otp-input"
            />
          ))}
        </div>

        <label>New password</label>
        <input type="password" required minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters" />

        <label>Confirm new password</label>
        <input type="password" required minLength={8} value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password" />

        <button type="submit" className="btn auth-btn" disabled={loading}>
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>

      <button className="auth-link-btn" style={{ marginTop: 16 }}
        onClick={() => { setStep('email'); setDigits(['','','','','','']); setErr(''); }}>
        Didn't get the code? Try again
      </button>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <div className="auth-page">
        <Suspense fallback={<div />}>
          <ForgotForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
