'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      setErr(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-box" onSubmit={onSubmit}>
        <div className="logo" style={{ marginBottom: 8 }}>
          NORTH<span>×</span>VERSE
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 24 }}>
          Admin panel
        </div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {err && <div className="err">{err}</div>}

        <button type="submit" className="btn btn-dark" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 12 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 16, textAlign: 'center' }}>
          Default credentials are set via backend .env
        </p>
      </form>
    </div>
  );
}
