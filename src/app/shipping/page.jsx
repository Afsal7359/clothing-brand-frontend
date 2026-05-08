'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const DEFAULTS = {
  standardPrice: '£3.99',
  standardTime:  '3–5 working days',
  expressPrice:  '£6.99',
  expressTime:   '1–2 working days',
  freeThreshold: '£250',
  cutoffTime:    '2pm GMT',
};

const ICONS = {
  standard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
      <rect x="2" y="7" width="14" height="13" rx="2" />
      <path d="M16 12h4l2 4v3h-6V12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="20" r="1.5" />
      <circle cx="18.5" cy="20" r="1.5" />
    </svg>
  ),
  express: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  international: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="28" height="28">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10A15.3 15.3 0 0 1 8 12a15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" strokeLinecap="round" />
    </svg>
  ),
};

export default function ShippingPage() {
  const [s, setS] = useState(DEFAULTS);

  useEffect(() => {
    fetch(`${API_URL}/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.pages?.shipping) setS({ ...DEFAULTS, ...d.pages.shipping }); })
      .catch(() => {});
  }, []);

  const options = [
    { key: 'standard',     icon: ICONS.standard,     title: 'Standard Delivery', price: s.standardPrice, time: s.standardTime, note: `Free on orders above ${s.freeThreshold}`, highlight: false },
    { key: 'express',      icon: ICONS.express,      title: 'Express Delivery',  price: s.expressPrice,  time: s.expressTime,  note: 'Available at checkout', highlight: true },
    { key: 'international',icon: ICONS.international,title: 'International',      price: 'Rates vary',    time: '7–14 working days', note: 'Customs charges may apply', highlight: false },
  ];

  const processingNotes = [
    `Orders placed before ${s.cutoffTime} on working days are dispatched the same day.`,
    'Orders placed on weekends or public holidays are dispatched the next working day.',
  ];

  return (
    <>
      <Header />
      <CartDrawer />

      <section className="section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 52 }}>
            <span className="section-subtitle">— Delivery info</span>
            <h1 className="section-title">Shipping</h1>
          </div>

          <div className="shipping-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 56 }}>
            {options.map((opt) => (
              <div
                key={opt.key}
                className="admin-card"
                style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, background: opt.highlight ? '#0a0a0a' : '#fff', color: opt.highlight ? '#fff' : 'inherit', border: opt.highlight ? '1px solid #0a0a0a' : undefined, position: 'relative' }}
              >
                {opt.highlight && (
                  <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', background: '#ff3e00', color: '#fff', padding: '3px 8px', borderRadius: 2 }}>
                    Fastest
                  </div>
                )}
                <div style={{ color: opt.highlight ? 'rgba(255,255,255,0.7)' : 'var(--ink-soft)' }}>{opt.icon}</div>
                <div>
                  <h2 style={{ fontFamily: 'var(--display)', fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 8 }}>{opt.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700 }}>{opt.price}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', opacity: 0.6 }}>·</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', opacity: opt.highlight ? 0.8 : 1, color: opt.highlight ? 'inherit' : 'var(--ink-soft)' }}>{opt.time}</span>
                  </div>
                  <p style={{ fontSize: 12.5, opacity: opt.highlight ? 0.65 : 1, color: opt.highlight ? 'inherit' : 'var(--ink-mute)', marginTop: 4 }}>{opt.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--line)', marginBottom: 48 }} />

          <div className="shipping-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            <div>
              <p className="section-subtitle" style={{ marginBottom: 14 }}>— Order processing</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px, 3vw, 28px)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>
                When does my order ship?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {processingNotes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink)', flexShrink: 0, marginTop: 7 }} />
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)' }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="section-subtitle" style={{ marginBottom: 14 }}>— After dispatch</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(20px, 3vw, 28px)', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20 }}>Tracking</h2>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', marginBottom: 24 }}>
                Once your order ships, you&apos;ll receive a tracking link via email. You can also track your order at any time using your order number and email on our Track Order page.
              </p>
              <Link href="/track-order" className="btn btn-outline" style={{ display: 'inline-flex' }}>
                Track an order
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ marginLeft: 8 }}>
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 56, padding: '28px 32px', background: '#f9f9f9', border: '1px solid var(--line)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6 }}>Pro tip</p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>
                Spend {s.freeThreshold} or more and get free standard delivery — automatically applied at checkout.
              </p>
            </div>
            <Link href="/collections/all" className="btn btn-dark" style={{ whiteSpace: 'nowrap' }}>Shop now</Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 760px) {
          .shipping-options { grid-template-columns: 1fr !important; }
          .shipping-info { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
    </>
  );
}
