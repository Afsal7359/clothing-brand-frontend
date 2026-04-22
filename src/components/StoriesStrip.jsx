'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';

const DEFAULT_STORIES = [
  { label: 'new caps',    image: 'https://picsum.photos/seed/story1/200/200', href: '/collections/caps' },
  { label: 'polo season', image: 'https://picsum.photos/seed/story2/200/200', href: '/collections/polo-club' },
  { label: 'dark grid',   image: 'https://picsum.photos/seed/story3/200/200', href: '/collections' },
  { label: 'new shirts',  image: 'https://picsum.photos/seed/story4/200/200', href: '/collections' },
  { label: 'ss26 look',   image: 'https://picsum.photos/seed/story5/200/200', href: '/collections' },
  { label: 'lookbook',    image: 'https://picsum.photos/seed/story6/200/200', href: '/collections' },
  { label: 'archive',     image: 'https://picsum.photos/seed/story7/200/200', href: '/collections' },
  { label: 'press',       image: 'https://picsum.photos/seed/story8/200/200', href: '/collections' },
];

export default function StoriesStrip({ stories = DEFAULT_STORIES }) {
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

  return (
    <section className="stories" aria-label="Featured stories" ref={scrollRef}>
      <div className="stories-row">
        {stories.map((s, i) => (
          <Link key={i} href={s.href} className="story">
            <div className="story-ring">
              <div style={{ backgroundImage: `url('${s.image}')` }} />
            </div>
            <div className="story-label">{s.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
