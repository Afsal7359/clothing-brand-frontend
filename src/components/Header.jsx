'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, setDrawerOpen } = useCart();

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site">
        <nav className="nav" aria-label="Main">
          <div className="nav-left">
            <button
              className="nav-item menu-toggle icon-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
              <span>menu</span>
            </button>
            <Link href="/collections" className="nav-item">new in</Link>
            <Link href="/collections" className="nav-item">collections</Link>
            <Link href="/collections/basics" className="nav-item">tops</Link>
            <Link href="/collections/caps" className="nav-item">caps</Link>
          </div>

          <Link href="/" className="logo" aria-label="NORTHVERSE home">
            NORTH<span>×</span>VERSE
          </Link>

          <div className="nav-right">
            <Link href="/collections" className="nav-item search icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <span>search</span>
            </Link>
            <Link href="/#stores" className="nav-item">stores</Link>
            <Link href="/admin" className="nav-item">admin</Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="nav-item cart icon-btn"
              aria-label="Open cart"
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

      {/* Mobile menu drawer */}
      <div
        className={`drawer-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />
      <aside className={`drawer left ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <div className="drawer-head">
          <div className="logo">NORTH<span>×</span>VERSE</div>
          <button className="drawer-close" onClick={closeMenu} aria-label="Close menu">✕</button>
        </div>
        <nav className="drawer-links" onClick={closeMenu}>
          <Link href="/collections">New In</Link>
          <Link href="/collections">Collections</Link>
          <Link href="/collections/basics">Tops</Link>
          <Link href="/collections/winter-25">Winter</Link>
          <Link href="/collections/caps">Caps</Link>
          <Link href="/#stores">Stores</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </aside>
    </>
  );
}
