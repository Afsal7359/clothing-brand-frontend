'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { resolveImage } from '@/lib/api';

export default function DiscoverSwiper({ items = [] }) {
  const router            = useRouter();
  const scrollRef         = useRef(null);
  const bulletsRef        = useRef(null);
  const swiperInstanceRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!items.length) return;
    const mq = window.matchMedia('(max-width: 700px)');
    let cleanup = () => {};

    const buildSwiper = async () => {
      if (swiperInstanceRef.current) return;
      const container = scrollRef.current;
      if (!container) return;

      // Mark active immediately so the grid never shows on mobile
      container.classList.add('swiper-active');

      // Swiper v8+ API: pass modules in the constructor, not via Swiper.use()
      const [{ default: Swiper }, , , { EffectCreative }] = await Promise.all([
        import('swiper'),
        import('swiper/css'),
        import('swiper/css/effect-creative'),
        import('swiper/modules'),
      ]);

      // Guard: component may have unmounted during async load
      if (!scrollRef.current) return;

      const cards = Array.from(container.querySelectorAll(':scope > .discover-card'));

      const swiperEl = document.createElement('div');
      swiperEl.className = 'swiper';
      const wrapper = document.createElement('div');
      wrapper.className = 'swiper-wrapper';

      cards.forEach((card) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.appendChild(card);
        wrapper.appendChild(slide);
      });
      swiperEl.appendChild(wrapper);
      container.appendChild(swiperEl);

      swiperInstanceRef.current = new Swiper(swiperEl, {
        modules: [EffectCreative],
        effect: 'creative',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        speed: 680,
        loop: true,
        // A small finger wobble during a tap must NOT count as a swipe — with
        // the default threshold:0 Swiper suppresses the click and links never
        // navigate. 10px lets taps through while real drags still swipe.
        threshold: 10,
        // Stacked-pages effect: prev cards go back in Z (no H overflow),
        // next cards slide in from the right. Works with body overflow-x:hidden.
        creativeEffect: {
          prev: {
            shadow: true,
            translate: [0, 0, -380],
          },
          next: {
            translate: ['100%', 0, 0],
          },
        },
        on: {
          slideChange() {
            setActiveIdx(this.realIndex);
          },
          // Tap = open the centered card. Navigate by the live active index so it
          // never matters which stacked/cloned slide physically caught the click.
          click() {
            const item = items[this.realIndex];
            if (item) router.push(`/collections/${item.slug}`);
          },
        },
      });
    };

    const destroySwiper = () => {
      const inst = swiperInstanceRef.current;
      if (!inst) return;
      const container = scrollRef.current;
      const originalCards = container
        ? Array.from(container.querySelectorAll('.discover-card'))
        : [];
      inst.destroy(true, true);
      swiperInstanceRef.current = null;
      if (container) {
        container.classList.remove('swiper-active');
        container.innerHTML = '';
        originalCards.forEach((c) => container.appendChild(c));
      }
    };

    const respond = (e) => {
      if (e.matches) buildSwiper();
      else destroySwiper();
    };

    respond(mq);
    mq.addEventListener('change', respond);
    cleanup = () => {
      mq.removeEventListener('change', respond);
      destroySwiper();
    };

    return cleanup;
  }, [items]);

  const goto = (i) => {
    const inst = swiperInstanceRef.current;
    if (inst) inst.slideToLoop(i);
  };

  if (!items.length) return null;

  const active = items[activeIdx] || items[0];

  return (
    <div className="discover-wrap">
      <div className="discover" ref={scrollRef}>
        {items.map((c, i) => (
          <Link
            href={`/collections/${c.slug}`}
            className="discover-card"
            key={c._id || i}
            onClick={(e) => {
              // On mobile the Swiper `click` handler navigates by active index;
              // block the native link so a stacked/clone card can't hijack it.
              if (swiperInstanceRef.current) e.preventDefault();
            }}
          >
            <img className="desktop" src={resolveImage(c.desktopImage, 1200) || `https://picsum.photos/seed/dc${i}d/1200/1500`} alt="" loading="lazy" decoding="async" />
            <img className="mobile"  src={resolveImage(c.mobileImage, 900)   || `https://picsum.photos/seed/dc${i}m/900/1400`}  alt="" loading="lazy" decoding="async" />
            <span className="counter">
              {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <div className="discover-card-body">
              {c.eyebrow && <span className="eyebrow">— {c.eyebrow}</span>}
              <h3>{c.title}</h3>
              <span className="btn">Shop now →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="discover-swiper-ui">
        <div className="swiper-caption">
          <b>{active.title}</b> — {String(activeIdx + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </div>
        <div className="swiper-pagination-custom" ref={bulletsRef}>
          {items.map((_, i) => (
            <span
              key={i}
              className={`bullet ${i === activeIdx ? 'is-active' : ''}`}
              onClick={() => goto(i)}
              role="button"
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
