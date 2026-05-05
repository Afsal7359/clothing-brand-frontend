'use client';

import Link from 'next/link';
import { resolveImage } from '@/lib/api';

export default function CategoryCirclesClient({ collections = [], activeSlug = '' }) {
  return (
    <div className="cat-circles-wrap">
      <div className="cat-circles">
        {/* All */}
        <Link href="/collections/all" className={`cat-circle${activeSlug === 'all' || activeSlug === '' ? ' is-active' : ''}`}>
          <div className="cat-circle-ring">
            <div className="cat-circle-all-inner">✦</div>
          </div>
          <div className="cat-circle-label">All</div>
        </Link>

        {/* DB collections */}
        {collections.map((c) => {
          const img = c.desktopImage || c.mobileImage || '';
          return (
            <Link key={c._id} href={`/collections/${c.slug}`} className={`cat-circle${activeSlug === c.slug ? ' is-active' : ''}`}>
              <div className="cat-circle-ring">
                {img
                  ? <div style={{ backgroundImage: `url('${resolveImage(img)}')` }} />
                  : <div className="cat-circle-all-inner">{c.title[0]?.toUpperCase()}</div>
                }
              </div>
              <div className="cat-circle-label">{c.title}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
