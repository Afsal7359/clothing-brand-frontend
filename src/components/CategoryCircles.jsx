'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
export { CATEGORIES };

// Used when images are passed as prop (from CategoryBar server component)
// or falls back to placeholder images from categories.js
export default function CategoryCircles({ activeCategory = 'all', images = {} }) {
  return (
    <div className="cat-circles-wrap">
      <div className="cat-circles">
        {CATEGORIES.map((c) => {
          const isActive = activeCategory === c.slug;
          const href = c.slug === 'all' ? '/collections/all' : `/collections/category/${c.slug}`;
          const img = (c.slug !== 'all' && images[c.slug]) ? images[c.slug] : c.image;
          return (
            <Link key={c.slug} href={href} className={`cat-circle${isActive ? ' is-active' : ''}`}>
              <div className="cat-circle-ring">
                <div style={{ backgroundImage: `url('${img}')` }} />
              </div>
              <div className="cat-circle-label">{c.label}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
