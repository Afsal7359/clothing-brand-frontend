'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { useUser } from '@/context/UserContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const STATUS_COLORS = {
  pending:    { bg: '#f3f4f6', color: '#6b7280', border: '#d1d5db' },
  confirmed:  { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  processing: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  shipped:    { bg: '#cffafe', color: '#0e7490', border: '#67e8f9' },
  delivered:  { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  cancelled:  { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
};

function StatusChip({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: 3,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function OrderCard({ order }) {
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const itemCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

  return (
    <div className="admin-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
      {/* Card head */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          background: '#fafafa',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}
          >
            #{order.orderNumber}
          </span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{date}</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            £{order.total?.toLocaleString('en-GB') || '—'}
          </span>
          <StatusChip status={order.status} />
        </div>
      </div>

      {/* Tracking timeline */}
      {order.trackingEvents && order.trackingEvents.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <p
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-mute)',
              marginBottom: 14,
            }}
          >
            Tracking events
          </p>
          <div className="tracking-timeline">
            {order.trackingEvents.map((ev, i) => (
              <div
                key={i}
                className={`tracking-event${i === 0 ? ' is-latest' : ''}`}
              >
                <div className="tracking-dot" />
                <div className="tracking-content">
                  <p style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{ev.message || ev.status}</p>
                  {ev.timestamp && (
                    <p
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10.5,
                        color: 'var(--ink-mute)',
                        marginTop: 2,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {new Date(ev.timestamp).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {order.trackingNumber && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--line)',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10.5,
              color: 'var(--ink-soft)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Tracking ID:
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>
            {order.trackingNumber}
          </span>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  const { user, loading: userLoading, userToken } = useUser();

  const [orderNum, setOrderNum] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupErr, setLookupErr] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersErr, setOrdersErr] = useState('');

  // Fetch user orders if logged in
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    const token = userToken();
    fetch(`${API_URL}/orders/my`, {
      headers: { 'x-user-token': `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrdersErr('Could not load your orders. Please try again.');
        setOrdersLoading(false);
      });
  }, [user, userToken]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!orderNum.trim() || !lookupEmail.trim()) return;
    setLookupLoading(true);
    setLookupErr('');
    setLookupResult(null);
    try {
      const res = await fetch(
        `${API_URL}/orders/track?orderNumber=${encodeURIComponent(orderNum.trim())}&email=${encodeURIComponent(lookupEmail.trim())}`
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Order not found. Check the order number and email.');
      }
      const data = await res.json();
      setLookupResult(data);
    } catch (err) {
      setLookupErr(err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <section className="section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <span className="section-subtitle">— Order tracking</span>
            <h1 className="section-title">Track Your Order</h1>
          </div>

          {/* ── Manual lookup card ── */}
          <div
            style={{
              maxWidth: 480,
              margin: '0 auto 56px',
            }}
          >
            <div className="admin-card" style={{ padding: 32 }}>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-soft)',
                  marginBottom: 20,
                }}
              >
                Look up any order
              </p>
              <form onSubmit={handleLookup}>
                <div className="field">
                  <label htmlFor="track-order-num">Order Number</label>
                  <input
                    id="track-order-num"
                    type="text"
                    placeholder="NV1234…"
                    value={orderNum}
                    onChange={(e) => setOrderNum(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="track-email">Email address</label>
                  <input
                    id="track-email"
                    type="email"
                    placeholder="Email used at checkout"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    required
                  />
                </div>

                {lookupErr && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      padding: '10px 14px',
                      borderRadius: 4,
                      fontSize: 13,
                      marginBottom: 14,
                    }}
                  >
                    {lookupErr}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={lookupLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 4 }}
                >
                  {lookupLoading ? 'Searching…' : 'Track Order'}
                </button>
              </form>

              {/* Lookup result */}
              {lookupResult && (
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
                  <OrderCard order={lookupResult} />
                </div>
              )}
            </div>
          </div>

          {/* ── My orders section (logged in users) ── */}
          {userLoading ? (
            <div className="loader" style={{ textAlign: 'center' }}>Loading…</div>
          ) : !user ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                borderTop: '1px solid var(--line)',
                maxWidth: 480,
                margin: '0 auto',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-mute)',
                  marginBottom: 12,
                }}
              >
                Have an account?
              </p>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 20 }}>
                Sign in to view all your past orders and live tracking in one place.
              </p>
              <Link
                href="/auth/login?redirect=/track-order"
                className="btn btn-dark"
              >
                Sign in to view orders
              </Link>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 28 }}>
                <span className="section-subtitle">— Your account</span>
                <h2
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: 'clamp(22px, 3vw, 32px)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                  }}
                >
                  My Orders
                </h2>
              </div>

              {ordersLoading && (
                <div className="loader">Loading your orders…</div>
              )}
              {ordersErr && (
                <div className="err" style={{ marginBottom: 16 }}>{ordersErr}</div>
              )}
              {!ordersLoading && !ordersErr && orders.length === 0 && (
                <div className="empty-state">
                  <p style={{ marginBottom: 20 }}>No orders yet.</p>
                  <Link href="/collections/all" className="btn btn-dark">
                    Start shopping
                  </Link>
                </div>
              )}
              {!ordersLoading && orders.map((order) => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
