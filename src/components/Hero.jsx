'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { realImage, resolveImage } from '@/lib/api';

/**
 * Hero banner. The images come from Site Settings (admin → Hero Banner).
 *
 * There is deliberately NO fallback image. This component used to default to a
 * picsum.photos URL, so any home-page render where /settings failed showed a
 * random stock photo as the campaign, then swapped to the real banner on the
 * next revalidate. A slow or missing banner now shows a neutral shimmer and
 * the real image fades in once it has actually decoded.
 */

function HeroMedia({ src, variant, ratio }) {
  const ref = useRef(null);
  // 'loading' → shimmer, 'ready' → image shown, 'blank' → nothing to show
  const [state, setState] = useState(src ? 'loading' : 'blank');

  useEffect(() => {
    if (!src) { setState('blank'); return; }
    const el = ref.current;
    // A cached image can finish decoding before hydration attaches onLoad,
    // which would otherwise leave the shimmer up permanently.
    if (el?.complete) setState(el.naturalWidth > 0 ? 'ready' : 'blank');
  }, [src]);

  const ready = state === 'ready';

  return (
    <div
      className={`hero-media ${variant}`}
      /* Reserve the frame while loading so the shimmer has height; once the
         real image is in, its own aspect ratio takes over (never cropped). */
      style={ready ? undefined : { aspectRatio: ratio }}
    >
      {!ready && (
        <div className={`hero-skeleton${state === 'loading' ? ' is-loading' : ''}`} aria-hidden="true" />
      )}
      {src && (
        <img
          ref={ref}
          className="hero-img"
          src={src}
          alt=""
          fetchPriority="high"
          decoding="async"
          style={{ opacity: ready ? 1 : 0 }}
          onLoad={() => setState('ready')}
          onError={() => setState('blank')}
        />
      )}
    </div>
  );
}

export default function Hero({ desktop, mobile, eyebrow, title, cta }) {
  // resolveImage adds Cloudinary f_auto/q_auto so the banner ships as WebP/AVIF.
  const deskSrc = resolveImage(realImage(desktop));
  // Fall back to the desktop image on mobile only if no mobile crop was set —
  // that is a real image either way, not a stand-in.
  const mobSrc = resolveImage(realImage(mobile)) || deskSrc;
  const label = cta?.label;

  return (
    <section className="hero" aria-label="Current campaign">
      <HeroMedia src={deskSrc} variant="desktop" ratio="16 / 9" />
      <HeroMedia src={mobSrc} variant="mobile" ratio="3 / 4" />
      <div className="hero-content">
        {eyebrow && <span className="hero-eyebrow">{eyebrow}</span>}
        {title && <h1 className="hero-title">{title}</h1>}
        {label && (
          <Link href={cta.href || '/collections'} className="btn">
            {label}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}
      </div>
    </section>
  );
}
