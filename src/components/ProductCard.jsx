'use client';

import Link from 'next/link';
import { useState } from 'react';
import { resolveImage } from '@/lib/api';

export default function ProductCard({ product }) {
  const [touched, setTouched] = useState(false);
  const main = product.images?.[0] || '';
  const alt = product.images?.[1] || main;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const soldOut = !product.inStock && product.variants?.length > 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`product ${touched ? 'touched' : ''}`}
      onTouchStart={() => setTouched((t) => !t)}
    >
      <div className="product-media">
        {soldOut && <span className="product-tag sold">Sold out</span>}
        {!soldOut && onSale && <span className="product-tag sale">Sale</span>}
        {!soldOut && !onSale && product.isNew && <span className="product-tag">New</span>}
        <img className="main" src={resolveImage(main)} alt={product.title} loading="lazy" />
        <img className="alt" src={resolveImage(alt)} alt="" loading="lazy" />
      </div>
      <div className="product-name">{product.title}</div>
      <div className="product-price">
        {onSale && <span className="strike">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>}
        <span className="now">₹{product.price.toLocaleString('en-IN')}</span>
      </div>
    </Link>
  );
}
