'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { resolveImage } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const STATUS_COLOR = {
  pending: '#d97706',
  confirmed: '#2563eb',
  processing: '#7c3aed',
  shipped: '#0891b2',
  delivered: '#16a34a',
  cancelled: '#dc2626',
};

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, userToken, loading } = useUser();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tab, setTab] = useState('orders');
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
    if (user) setProfile({ name: user.name || '', phone: user.phone || '' });
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const token = userToken();
        const res = await fetch(`${API_URL}/orders/my`, {
          headers: { 'x-user-token': `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      setOrdersLoading(false);
    };
    fetchOrders();
  }, [user, userToken]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const token = userToken();
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-token': `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (res.ok) setSaveMsg('Saved!');
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleLogout = () => { logout(); router.push('/'); };

  if (loading) return null;
  if (!user) return null;

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <div className="account-page">
        <div className="account-sidebar">
          <div className="account-avatar">
            {user.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{(user.name || user.email)[0]?.toUpperCase()}</span>}
          </div>
          <div className="account-name">{user.name || 'User'}</div>
          <div className="account-email">{user.email}</div>

          <nav className="account-nav">
            <button onClick={() => setTab('orders')} className={tab === 'orders' ? 'active' : ''}>Order History</button>
            <button onClick={() => setTab('profile')} className={tab === 'profile' ? 'active' : ''}>Profile</button>
          </nav>

          <button className="account-logout" onClick={handleLogout}>Log out</button>
        </div>

        <div className="account-main">
          {/* ── Orders tab ── */}
          {tab === 'orders' && (
            <div>
              <h2 className="account-tab-title">Order History</h2>
              {ordersLoading && <p style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: 12 }}>Loading…</p>}
              {!ordersLoading && orders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)' }}>
                  <p>No orders yet.</p>
                  <Link href="/collections/all" className="btn" style={{ marginTop: 16, display: 'inline-block' }}>Start shopping</Link>
                </div>
              )}
              <div className="order-list">
                {orders.map((o) => (
                  <div key={o._id} className="order-card">
                    <div className="order-card-head">
                      <div>
                        <span className="order-number">#{o.orderNumber}</span>
                        <span className="order-date">{new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <span className="order-status-badge" style={{ background: STATUS_COLOR[o.status] || '#888' }}>
                        {o.status}
                      </span>
                    </div>
                    <div className="order-items-preview">
                      {o.items.slice(0, 3).map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                          {item.image && <img src={resolveImage(item.image)} alt={item.title} style={{ width: 48, height: 60, objectFit: 'cover', borderRadius: 2 }} />}
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</p>
                            <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Qty {item.quantity}{item.size ? ` · ${item.size}` : ''}</p>
                          </div>
                        </div>
                      ))}
                      {o.items.length > 3 && <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>+{o.items.length - 3} more</p>}
                    </div>
                    <div className="order-card-foot">
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>£{o.total?.toLocaleString('en-GB')}</span>
                      {o.paymentMethod === 'cod'
                        ? <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}>COD</span>
                        : <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#16a34a' }}>Paid</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div>
              <h2 className="account-tab-title">Profile</h2>
              <form onSubmit={handleSaveProfile} className="auth-form" style={{ maxWidth: 440 }}>
                <label>Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                <label>Phone</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                <label>Email</label>
                <input type="email" value={user.email} disabled style={{ opacity: 0.6 }} />
                <button type="submit" className="btn auth-btn" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                {saveMsg && <p style={{ color: '#16a34a', fontFamily: 'var(--mono)', fontSize: 12, marginTop: 8 }}>{saveMsg}</p>}
              </form>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
