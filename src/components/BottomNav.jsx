'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { resolveImage } from '@/lib/api';
import logoSrc from '../../public/logo.png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

/* ─── Mobile sidebar ─────────────────────────────────── */
function MobileSidebar({ open, onClose, user, logout, collections }) {
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`drawer left mobile-sidebar ${open ? 'open' : ''}`} aria-hidden={!open}>

        <div className="sidebar-head">
          <Link href="/" className="logo" onClick={onClose}>
            <img src={logoSrc.src} alt="underdawg" className="logo-img" />
          </Link>
          <button className="drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Collections circles from DB */}
        {collections.length > 0 && (
          <div className="sidebar-cats">
            <p className="sidebar-label">Collections</p>
            <div className="sidebar-cat-scroll">
              {/* All */}
              <Link href="/collections/all" className="sidebar-cat-item" onClick={onClose}>
                <div className="sidebar-cat-circle"><span>✦</span></div>
                <span>All</span>
              </Link>
              {collections.map((c) => {
                const img = c.desktopImage || c.mobileImage || '';
                return (
                  <Link key={c._id} href={`/collections/${c.slug}`} className="sidebar-cat-item" onClick={onClose}>
                    <div className="sidebar-cat-circle">
                      {img
                        ? <div style={{ backgroundImage: `url('${resolveImage(img)}')` }} />
                        : <span>{c.title[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span>{c.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="drawer-links" onClick={onClose}>
          <Link href="/">Home</Link>
          <Link href="/collections/all">Shop All</Link>
          <Link href="/#stores">Stores</Link>
          {user
            ? <Link href="/account">My Account</Link>
            : <Link href="/auth/login">Sign in</Link>}
          {user && (
            <button onClick={() => { logout(); onClose(); }} style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 'inherit', color: 'var(--ink-soft)' }}>
              Log out
            </button>
          )}
        </nav>

      </aside>
    </>
  );
}

/* ─── Bottom nav pill ────────────────────────────────── */
export default function BottomNav() {
  const pathname = usePathname();
  const { count, setDrawerOpen } = useCart();
  const { user, logout } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/collections`)
      .then((r) => r.json())
      .then((d) => setCollections(d.items || []))
      .catch(() => { });
  }, []);

  const isHome = pathname === '/';

  return (
    <>
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        logout={logout}
        collections={collections}
      />

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {/* Home */}
        <Link href="/" className={`bn-btn ${isHome ? 'bn-active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12L12 4l9 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {/* Cart */}
        <button className="bn-btn" onClick={() => setDrawerOpen(true)} data-track="bottomnav-cart">
          <span className="bn-cart-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 7h12l-1.4 11.2a2 2 0 01-2 1.8H9.4a2 2 0 01-2-1.8L6 7z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 7a3 3 0 116 0" strokeLinecap="round" />
            </svg>
            {count > 0 && <span className="bn-badge">{count}</span>}
          </span>
        </button>

        {/* Menu */}
        <button className="bn-btn" onClick={() => setSidebarOpen(true)} data-track="bottomnav-menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="7" x2="20" y2="7" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
            <line x1="4" y1="17" x2="20" y2="17" strokeLinecap="round" />
          </svg>
        </button>
      </nav>
    </>
  );
}
