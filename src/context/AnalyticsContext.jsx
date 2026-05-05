'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initSession, track } from '@/lib/tracker';

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const pathname   = usePathname();
  const prevPath   = useRef(null);
  const observerRef = useRef(null);
  const scrollMilestones = useRef(new Set());

  const isAdmin = pathname.startsWith('/admin');

  /* ── Boot session once ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (isAdmin) return;
    initSession();
  }, [isAdmin]);

  /* ── Pageview on route change ──────────────────────────────────────────── */
  useEffect(() => {
    if (isAdmin) return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    scrollMilestones.current = new Set(); // reset scroll tracking per page
    track('pageview', pathname);

    // Set up section observers after the DOM settles
    const t = setTimeout(() => setupSectionObserver(pathname), 600);
    return () => clearTimeout(t);
  }, [pathname, isAdmin]);

  /* ── Section IntersectionObserver ─────────────────────────────────────── */
  function setupSectionObserver(page) {
    if (observerRef.current) observerRef.current.disconnect();
    const sections = document.querySelectorAll('[data-section]');
    if (!sections.length) return;

    const seen = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const name = entry.target.dataset.section;
          if (seen.has(name)) return;
          seen.add(name);
          track('section_view', page, { section: name });
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((el) => observer.observe(el));
    observerRef.current = observer;
  }

  /* ── Click delegation ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (isAdmin) return;
    const handleClick = (e) => {
      const el = e.target.closest('[data-track]');
      if (!el) return;
      track('click', window.location.pathname, {
        label: el.dataset.track,
        tag:   el.tagName.toLowerCase(),
      });
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isAdmin]);

  /* ── Scroll depth ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isAdmin) return;
    const milestones = [25, 50, 75, 90];
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrolled = window.scrollY + window.innerHeight;
        const total    = document.documentElement.scrollHeight;
        const pct      = Math.round((scrolled / total) * 100);
        milestones.forEach((m) => {
          if (pct >= m && !scrollMilestones.current.has(m)) {
            scrollMilestones.current.add(m);
            track('scroll_depth', window.location.pathname, { depth: m });
          }
        });
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isAdmin]);

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
