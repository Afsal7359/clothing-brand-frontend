'use client';

import { useRef, useEffect } from 'react';

const DEFAULT_STORES = [
  { city: 'Delhi',     address: 'Greater Kailash II, New Delhi, 110048',  image: 'https://picsum.photos/seed/delhi/800/500',     directionsUrl: '#', phone: '+910000000000', isOpen: true },
  { city: 'Mumbai',    address: '14th Rd, Khar West, Mumbai, 400052',     image: 'https://picsum.photos/seed/mumbai/800/500',    directionsUrl: '#', phone: '+910000000000', isOpen: true },
  { city: 'Hyderabad', address: 'Banjara Hills, Hyderabad, 500034',       image: 'https://picsum.photos/seed/hyderabad/800/500', directionsUrl: '#', phone: '+910000000000', isOpen: true },
  { city: 'Ahmedabad', address: 'Ashok Vatika, Ahmedabad, 380058',        image: 'https://picsum.photos/seed/ahmedabad/800/500', directionsUrl: '#', phone: '+910000000000', isOpen: true },
  { city: 'Gurugram',  address: 'DLF Phase 3, Gurugram, 122010',          image: 'https://picsum.photos/seed/gurugram/800/500',  directionsUrl: '#', phone: '+910000000000', isOpen: true },
  { city: 'Bengaluru', address: 'Indiranagar, Bengaluru, 560038',         image: 'https://picsum.photos/seed/bengaluru/800/500', directionsUrl: '#', phone: '+910000000000', isOpen: true },
];

export default function Stores({ stores = DEFAULT_STORES }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timer;

    const advance = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const max = scrollWidth - clientWidth;
      if (max <= 0) return; // desktop grid — nothing to scroll
      const card = el.querySelector('article');
      const step = card ? card.offsetWidth + 12 : clientWidth;
      const next = scrollLeft + step;
      el.scrollTo({ left: next >= max ? 0 : next, behavior: 'smooth' });
    };

    const start = () => { timer = setInterval(advance, 3000); };
    const stop  = () => { clearInterval(timer); };

    start();
    el.addEventListener('touchstart', stop,  { passive: true });
    el.addEventListener('touchend',   start, { passive: true });

    return () => {
      stop();
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchend',   start);
    };
  }, [stores]);

  return (
    <section className="section" id="stores" style={{ background: '#fafafa' }}>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
        — Stores across India
      </p>
      <h2 className="section-title" style={{ marginBottom: 28 }}>Walk In</h2>

      <div className="stores-grid" ref={scrollRef}>
        {stores.map((s, idx) => (
          <article key={idx} style={{ border: '1px solid var(--line)', overflow: 'hidden', background: '#fff', borderRadius: 4 }}>
            <div
              style={{
                aspectRatio: '16 / 10',
                backgroundImage: `url('${s.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 12, left: 12,
                  fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.95)', padding: '5px 10px', borderRadius: 2,
                }}
              >
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: s.isOpen ? '#22c55e' : '#ef4444', marginRight: 6, verticalAlign: 'middle' }} />
                {s.isOpen ? 'Open now' : 'Closed'}
              </span>
            </div>
            <div style={{ padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 24, textTransform: 'uppercase', marginBottom: 8 }}>
                {s.city}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>{s.address}</p>
              <div style={{ display: 'flex', gap: 14 }}>
                <a href={s.directionsUrl || '#'} style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--line)', paddingBottom: 2 }}>Directions</a>
                {s.phone && (
                  <a href={`tel:${s.phone}`} style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--line)', paddingBottom: 2 }}>Call</a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
