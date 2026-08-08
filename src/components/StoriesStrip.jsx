'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { realImage, resolveImage } from '@/lib/api';

/* Stories come from Site Settings. No stand-in images — with nothing
   configured the strip renders nothing rather than stock photos. */
export default function StoriesStrip({ stories = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timer;

    const advance = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const max = scrollWidth - clientWidth;
      if (max <= 0) return; // all stories fit — nothing to scroll
      const next = scrollLeft + 94; // ~1 story (76px) + gap (18px)
      el.scrollTo({ left: next >= max ? 0 : next, behavior: 'smooth' });
    };

    const start = () => { timer = setInterval(advance, 2500); };
    const stop  = () => { clearInterval(timer); };

    start();
    el.addEventListener('touchstart', stop,  { passive: true });
    el.addEventListener('touchend',   start, { passive: true });

    return () => {
      stop();
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchend',   start);
    };
  }, [stories]);

  if (!stories.length) return null;

  return (
    <section className="stories" aria-label="Featured stories" ref={scrollRef}>
      <div className="stories-row">
        {stories.map((s, i) => (
          <Link key={i} href={s.href} className="story">
            <div className="story-ring">
              <div
                className={realImage(s.image) ? undefined : 'img-skeleton'}
                style={{ backgroundImage: realImage(s.image) ? `url('${resolveImage(s.image, 200)}')` : undefined }}
              />
            </div>
            <div className="story-label">{s.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
