'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import logoSrc from '../../public/logo.png';

function Logo() {
  return (
    <Link href="/" className="logo" aria-label="underdawg home">
      <img src={logoSrc.src} alt="underdawg" className="logo-img" />
    </Link>
  );
}

export default function Header() {
  const { count, setDrawerOpen } = useCart();
  const { user } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site${scrolled ? ' header-scrolled' : ''}`}>
      <nav className="nav">
        <Logo />

        {/* Desktop-only nav left */}
        <div className="nav-left">
          <Link href="/collections" className="nav-item">new in</Link>
          <Link href="/collections/all" className="nav-item">collections</Link>
        </div>

        {/* Desktop-only nav right */}
        <div className="nav-right">
          <Link href="/collections" className="nav-item search icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>
            <span>search</span>
          </Link>
          <Link href="/#stores" className="nav-item">stores</Link>
          {user ? (
            <Link href="/account" className="nav-item icon-btn" aria-label="Account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <span>{user.name?.split(' ')[0] || 'account'}</span>
            </Link>
          ) : (
            <Link href="/auth/login" className="nav-item">sign in</Link>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            className="nav-item cart icon-btn"
            aria-label="Open cart"
            data-track="header-cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h12l-1.4 11.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 7z" />
              <path d="M9 7a3 3 0 1 1 6 0" />
            </svg>
            <span>bag</span>
            <span className="cart-count">{count}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
