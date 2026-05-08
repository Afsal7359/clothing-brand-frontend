'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

const FAQ_CATEGORIES = [
  {
    id: 'orders',
    label: 'Orders & Shipping',
    questions: [
      {
        q: 'How do I track my order?',
        a: "Once your order is shipped, you'll receive a tracking link via email. You can also use our Track Order page — just enter your order number and the email address used at checkout.",
        link: { href: '/track-order', text: 'Track an order' },
      },
      {
        q: 'Can I change or cancel my order?',
        a: 'Orders can be cancelled or modified within 1 hour of placing them. After that, the order enters our fulfilment pipeline and cannot be changed. Contact us immediately at support@northverse.com if you need to make a change.',
        link: null,
      },
      {
        q: 'Do you offer international shipping?',
        a: 'Yes, we ship internationally. Delivery times are typically 7–14 working days depending on the destination. Customs duties and taxes may be applicable and are the responsibility of the recipient.',
        link: { href: '/shipping', text: 'View shipping info' },
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards via Stripe. Cash on Delivery is also available for eligible UK orders.',
        link: null,
      },
    ],
  },
  {
    id: 'returns',
    label: 'Returns & Products',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We accept returns within 7 days of delivery. Items must be unworn, unwashed, and returned with their original tags attached. Sale items, accessories, and personalised pieces are final sale and cannot be returned.',
        link: { href: '/returns', text: 'Full returns policy' },
      },
      {
        q: 'How do I initiate a return?',
        a: "Email us at support@northverse.com with your order number and the reason for the return. We'll confirm eligibility and walk you through the process, including sending a return label if approved.",
        link: null,
      },
      {
        q: 'Are sale items returnable?',
        a: 'No — sale items are final sale and cannot be returned or exchanged. This applies to any item purchased at a discounted price, including during promotional events.',
        link: null,
      },
      {
        q: 'How do I find my size?',
        a: "Every product page includes a detailed size guide with measurements in both centimetres and inches. If you're between sizes, we recommend sizing up for a more relaxed, oversized fit — which is how our pieces are intended to be worn.",
        link: null,
      },
    ],
  },
];

function AccordionItem({ question, answer, link, isOpen, onToggle }) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--line)',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--ink)',
        }}
        aria-expanded={isOpen}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 500,
            lineHeight: 1.45,
            letterSpacing: '-0.01em',
            transition: 'opacity 0.2s',
            opacity: isOpen ? 1 : 0.85,
          }}
        >
          {question}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 18,
            lineHeight: 1,
            flexShrink: 0,
            marginTop: 2,
            width: 20,
            textAlign: 'center',
            transition: 'transform 0.25s',
            transform: isOpen ? 'rotate(45deg)' : 'none',
            color: isOpen ? 'var(--ink)' : 'var(--ink-soft)',
          }}
        >
          +
        </span>
      </button>

      <div
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? 500 : 0,
          transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            paddingBottom: 22,
            paddingRight: 40,
          }}
        >
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--ink-soft)',
              marginBottom: link ? 14 : 0,
            }}
          >
            {answer}
          </p>
          {link && (
            <Link
              href={link.href}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10.5,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                borderBottom: '1px solid var(--ink)',
                paddingBottom: 1,
                display: 'inline-block',
              }}
            >
              {link.text} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [openKey, setOpenKey] = useState(null);
  const [supportHours, setSupportHours] = useState('Mon–Sat · 10am–6pm GMT · Reply within 24 hours');

  useEffect(() => {
    fetch(`${API_URL}/settings`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.pages?.faq?.supportHours) setSupportHours(d.pages.faq.supportHours); })
      .catch(() => {});
  }, []);

  const toggle = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <section className="section">
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: 52 }}>
            <span className="section-subtitle">— Help centre</span>
            <h1 className="section-title">Frequently Asked<br />Questions</h1>
          </div>

          {/* Category tabs — quick nav */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 40,
              flexWrap: 'wrap',
            }}
          >
            {FAQ_CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '7px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  color: 'var(--ink-soft)',
                  transition: 'all 0.2s',
                  display: 'inline-block',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0a0a0a';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#0a0a0a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--ink-soft)';
                  e.currentTarget.style.borderColor = 'var(--line)';
                }}
              >
                {cat.label}
              </a>
            ))}
          </div>

          {/* Categories */}
          {FAQ_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              id={cat.id}
              style={{ marginBottom: 56 }}
            >
              {/* Category heading */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-mute)',
                  }}
                >
                  {cat.id === 'orders' ? '01' : '02'}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
              <h2
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.01em',
                  marginBottom: 4,
                }}
              >
                {cat.label}
              </h2>

              {/* Questions */}
              <div style={{ marginTop: 4 }}>
                {cat.questions.map((item, i) => {
                  const key = `${cat.id}-${i}`;
                  return (
                    <AccordionItem
                      key={key}
                      question={item.q}
                      answer={item.a}
                      link={item.link}
                      isOpen={openKey === key}
                      onToggle={() => toggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Still have questions? */}
          <div
            style={{
              marginTop: 8,
              padding: '36px 32px',
              background: '#0a0a0a',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.45)',
                  marginBottom: 8,
                }}
              >
                Still have questions?
              </p>
              <h3
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: 'clamp(20px, 3vw, 26px)',
                  textTransform: 'uppercase',
                  color: '#fff',
                  letterSpacing: '-0.01em',
                }}
              >
                We're here to help.
              </h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
                {supportHours}
              </p>
            </div>
            <Link
              href="/contact"
              className="btn"
              style={{ whiteSpace: 'nowrap' }}
            >
              Get in touch
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
