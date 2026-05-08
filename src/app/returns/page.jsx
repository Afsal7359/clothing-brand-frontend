'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export default function ReturnsPage() {
  const [s, setS] = useState({ email: 'support@northverse.com', windowDays: '7', refundDays: '5–7' });

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((r) => r.json())
      .then((d) => { if (d.pages?.returns) setS((prev) => ({ ...prev, ...d.pages.returns })); })
      .catch(() => {});
  }, []);

  const policies = [
    { title: `${s.windowDays}-Day Return Window`, body: `Items can be returned within ${s.windowDays} days of delivery. They must be unworn, unwashed, with all original tags attached. We inspect every return before processing.` },
    { title: 'Exchange Process', body: 'We offer size exchanges subject to stock availability. Please contact us first before sending any items back so we can confirm the exchange and reserve your size.' },
    { title: 'Non-Returnable Items', body: 'Sale items, accessories, and custom or personalised pieces cannot be returned or exchanged. These are final sale. Please review your order carefully before completing checkout.' },
    { title: 'Refund Timeline', body: `Approved refunds are processed within ${s.refundDays} business days of us receiving the item. The refund is issued to your original payment method. Processing times may vary by bank.` },
  ];

  const howToSteps = [
    { step: 1, text: `Email us at ${s.email} with your order number and reason for return.` },
    { step: 2, text: "We'll confirm eligibility and, if approved, send you a prepaid return label within 24 hours." },
    { step: 3, text: 'Pack the item securely in its original packaging if possible and drop it at any courier point.' },
    { step: 4, text: `Your refund or exchange is processed within ${s.refundDays} days of us receiving the returned item.` },
  ];

  return (
    <>
      <Header />
      <CartDrawer />

      <section className="section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 52 }}>
            <span className="section-subtitle">— Returns policy</span>
            <h1 className="section-title">Returns &amp; Exchanges</h1>
          </div>

          {/* Two-column layout */}
          <div
            className="returns-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: 40,
              alignItems: 'flex-start',
            }}
          >
            {/* ── Left: policy details ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {policies.map((policy, i) => (
                <div
                  key={policy.title}
                  style={{
                    paddingTop: i === 0 ? 0 : 28,
                    paddingBottom: 28,
                    borderBottom: i < policies.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <h2
                    style={{
                      fontFamily: 'var(--display)',
                      fontSize: 'clamp(18px, 2.5vw, 24px)',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.01em',
                      marginBottom: 12,
                    }}
                  >
                    {policy.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: 'var(--ink-soft)',
                      maxWidth: 540,
                    }}
                  >
                    {policy.body}
                  </p>
                </div>
              ))}

              {/* Contact nudge */}
              <div style={{ paddingTop: 32 }}>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--ink-soft)',
                    lineHeight: 1.7,
                    marginBottom: 16,
                  }}
                >
                  Have a question about a specific order?{' '}
                  <Link
                    href="/contact"
                    style={{
                      color: 'var(--ink)',
                      borderBottom: '1px solid var(--ink)',
                      paddingBottom: 1,
                    }}
                  >
                    Reach out to us
                  </Link>{' '}
                  and we'll sort it out.
                </p>
              </div>
            </div>

            {/* ── Right: how-to card ── */}
            <div className="returns-sticky" style={{ position: 'sticky', top: 90 }}>
              <div className="admin-card" style={{ padding: 28 }}>
                <p
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-mute)',
                    marginBottom: 18,
                  }}
                >
                  Step by step
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--display)',
                    fontSize: 22,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.01em',
                    marginBottom: 24,
                  }}
                >
                  How to Return
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {howToSteps.map((item, i) => (
                    <div
                      key={item.step}
                      style={{
                        display: 'flex',
                        gap: 16,
                        paddingBottom: i < howToSteps.length - 1 ? 20 : 0,
                        position: 'relative',
                      }}
                    >
                      {/* Step number + connector line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: 'var(--ink)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'var(--mono)',
                            fontSize: 11,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {item.step}
                        </div>
                        {i < howToSteps.length - 1 && (
                          <div
                            style={{
                              width: 1,
                              flex: 1,
                              background: 'var(--line)',
                              marginTop: 6,
                              minHeight: 16,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.7,
                          color: 'var(--ink-soft)',
                          paddingTop: 4,
                        }}
                      >
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: '1px solid var(--line)',
                  }}
                >
                  <Link href="/contact" className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }}>
                    Contact us to start a return
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive styles via inline style tag */}
      <style>{`
        @media (max-width: 820px) {
          .returns-grid {
            grid-template-columns: 1fr !important;
          }
          .returns-sticky {
            position: static !important;
          }
        }
      `}</style>

      <Footer />
    </>
  );
}
