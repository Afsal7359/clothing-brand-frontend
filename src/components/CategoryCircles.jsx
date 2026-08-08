'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { realImage, resolveImage } from '@/lib/api';
export { CATEGORIES };

// `images` maps category slug → a real product image, supplied by the
// CategoryBar server component. A category with no product image yet shows a
// grey tile; 'all' keeps its gradient ring by design.
export default function CategoryCircles({ activeCategory = 'all', images = {} }) {
  return (
    <div className="cat-circles-wrap">
      <div className="cat-circles">
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c.slug;
          const href = c.slug === 'all' ? '/collections/all' : `/collections/category/${c.slug}`;
          const img = c.slug === 'all' ? '' : realImage(images[c.slug]);
          const blank = !img && c.slug !== 'all';
          return (
            <Link key={c.slug} href={href} className={`cat-circle${isActive ? ' is-active' : ''}`}>
              <div className="cat-circle-ring">
                <div
                  className={blank ? 'img-skeleton' : undefined}
                  style={{ backgroundImage: img ? `url('${resolveImage(img, 200)}')` : undefined }}
                />
              </div>
              <div className="cat-circle-label">{c.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
