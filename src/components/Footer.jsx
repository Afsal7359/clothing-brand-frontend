'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const DEFAULT_FOOTER = {
  description:   'Premium streetwear. New drops every season.',
  instagramUrl:  '',
  whatsappUrl:   '',
  copyrightText: '',
  supportLinks: [
    { label: 'Track Order',         href: '/track-order' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Shipping',            href: '/shipping' },
    { label: 'FAQ',                 href: '/faq' },
    { label: 'Contact',             href: '/contact' },
  ],
};

export default function Footer() {
  const [joined, setJoined] = useState(false);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((r) => r.json())
      .then((s) => {
        if (s.footer) {
          setFooter({
            ...DEFAULT_FOOTER,
            ...s.footer,
            supportLinks: s.footer.supportLinks?.length ? s.footer.supportLinks : DEFAULT_FOOTER.supportLinks,
          });
        }
      })
      .catch(() => {});
  }, []);

  const year = new Date().getFullYear();
  const copyright = footer.copyrightText || `© ${year} underdwag. All rights reserved.`;

  return (
    <footer className="site">
      <div className="foot-top">
        {/* Brand + newsletter + social */}
        <div className="foot-brand">
          <div className="logo">underdwag</div>
          <p>{footer.description}</p>
          <form
            className="newsletter"
            onSubmit={(e) => {
              e.preventDefault();
              setJoined(true);
              e.currentTarget.reset();
            }}
          >
            <input type="email" required placeholder="your@email.com" aria-label="Email" />
            <button type="submit">{joined ? 'Joined ✓' : 'Join'}</button>
          </form>

          {/* Social icons — always visible, dimmed until URL is set in admin */}
          <div className="foot-socials">
            {/* Instagram — brand gradient */}
            <a
              href={footer.instagramUrl || '#'}
              target={footer.instagramUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={`foot-social-btn foot-social-btn--insta${footer.instagramUrl ? '' : ' foot-social-btn--unset'}`}
              onClick={!footer.instagramUrl ? (e) => e.preventDefault() : undefined}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                    <stop offset="0%"   stopColor="#fdf497"/>
                    <stop offset="5%"   stopColor="#fdf497"/>
                    <stop offset="45%"  stopColor="#fd5949"/>
                    <stop offset="60%"  stopColor="#d6249f"/>
                    <stop offset="90%"  stopColor="#285AEB"/>
                  </radialGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)"/>
                <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="1.8" fill="none"/>
                <circle cx="17.3" cy="6.7" r="1.1" fill="#fff"/>
              </svg>
              <span>Instagram</span>
            </a>

            {/* WhatsApp — brand green */}
            <a
              href={footer.whatsappUrl || '#'}
              target={footer.whatsappUrl ? '_blank' : undefined}
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={`foot-social-btn foot-social-btn--wa${footer.whatsappUrl ? '' : ' foot-social-btn--unset'}`}
              onClick={!footer.whatsappUrl ? (e) => e.preventDefault() : undefined}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="#25D366"/>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#fff"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Shop column */}
        <div className="foot-col">
          <h4>Shop</h4>
          <ul>
            <li><Link href="/collections/all">New In</Link></li>
            <li><Link href="/collections">T-Shirts</Link></li>
            <li><Link href="/collections">Hoodies</Link></li>
            <li><Link href="/collections">Jackets</Link></li>
            <li><Link href="/collections">Caps</Link></li>
          </ul>
        </div>

        {/* Support column — DB-driven */}
        <div className="foot-col">
          <h4>Support</h4>
          <ul>
            {footer.supportLinks.map((link, i) => (
              <li key={i}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="foot-bottom">
        <span>{copyright}</span>
        <span>Manchester · London</span>
      </div>
    </footer>
  );
}
