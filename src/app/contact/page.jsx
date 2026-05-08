'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const SUBJECTS = ['Order Issue', 'Returns', 'General', 'Wholesale'];

const EMAIL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
    <path d="M21 15.46l-5.09-.44-2.36 2.36a15.94 15.94 0 0 1-7.93-7.93l2.37-2.37L7.55 3H3.03C2.45 13.18 10.82 21.55 21 20.97v-5.51z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CLOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CAL_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
  </svg>
);

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contactSettings, setContactSettings] = useState({ email: 'support@northverse.com', whatsappHref: '', hours: 'Mon–Sat, 10am–6pm GMT' });

  useEffect(() => {
    fetch(`${API_URL}/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.pages?.contact) setContactSettings((c) => ({ ...c, ...d.pages.contact })); })
      .catch(() => {});
  }, []);

  const infoCards = [
    { icon: EMAIL_ICON, label: 'Email', value: contactSettings.email, href: `mailto:${contactSettings.email}` },
    ...(contactSettings.whatsappHref ? [{ icon: WA_ICON, label: 'WhatsApp', value: 'Message us on WhatsApp', href: contactSettings.whatsappHref }] : []),
    { icon: CLOCK_ICON, label: 'Response time', value: 'Within 24 hours', href: null },
    { icon: CAL_ICON, label: 'Hours', value: contactSettings.hours, href: null },
  ];

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate a short delay — no real API call
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 800);
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <section className="section">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 48 }}>
            <span className="section-subtitle">— Get in touch</span>
            <h1 className="section-title">Contact Us</h1>
          </div>

          <div
            className="contact-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 40,
              alignItems: 'flex-start',
            }}
          >
            {/* ── Left: contact form ── */}
            <div className="admin-card" style={{ padding: 32 }}>
              {submitted ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 16,
                    padding: '24px 0',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#0a0a0a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="22" height="22">
                      <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10.5,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-soft)',
                        marginBottom: 8,
                      }}
                    >
                      Message sent
                    </p>
                    <h2
                      style={{
                        fontFamily: 'var(--display)',
                        fontSize: 28,
                        textTransform: 'uppercase',
                        marginBottom: 12,
                      }}
                    >
                      Got it.
                    </h2>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 380 }}>
                      We'll get back to you within 24 hours. Check your inbox — including spam — for our reply.
                    </p>
                  </div>
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: 8 }}
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}
                  >
                    <div className="field">
                      <label htmlFor="contact-name">Name</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="contact-email">Email</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="contact-subject">Subject</label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select a topic</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="contact-message">Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={6}
                      placeholder="Describe your issue or question in detail…"
                      value={form.message}
                      onChange={handleChange}
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-dark"
                    disabled={submitting}
                    style={{ width: '100%', justifyContent: 'center', padding: 15, marginTop: 6 }}
                  >
                    {submitting ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>

            {/* ── Right: info cards ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {infoCards.map((card) => (
                <div
                  key={card.label}
                  className="admin-card"
                  style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--ink)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-mute)',
                        marginBottom: 4,
                      }}
                    >
                      {card.label}
                    </p>
                    {card.href ? (
                      <a
                        href={card.href}
                        style={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          color: 'var(--ink)',
                          borderBottom: '1px solid var(--line)',
                          paddingBottom: 1,
                        }}
                      >
                        {card.value}
                      </a>
                    ) : (
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink)' }}>
                        {card.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Divider note */}
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.12em',
                  color: 'var(--ink-mute)',
                  lineHeight: 1.7,
                  paddingTop: 8,
                }}
              >
                For urgent matters, WhatsApp is the fastest way to reach us. We reply to emails in order of receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive column stack */}
      <style>{`
        @media (max-width: 760px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
    </>
  );
}
