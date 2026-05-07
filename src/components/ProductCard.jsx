'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { resolveImage } from '@/lib/api';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const main = product.images?.[0] || '';
  const alt = product.images?.[1] || '';
  const hasAlt = !!alt;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const soldOut = !product.inStock && product.variants?.length > 0;
  const hasVariants = product.variants?.length > 0;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    if (hasVariants) {
      // Has sizes — go to detail page so user can pick
      window.location.href = `/product/${product.slug}`;
      return;
    }
    add({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: main,
      size: '',
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link href={`/product/${product.slug}`} className="product">
      <div className={`product-media${hasAlt ? ' has-alt' : ''}`}>
        {soldOut && <span className="product-tag sold">Sold out</span>}
        {!soldOut && onSale && <span className="product-tag sale">Sale</span>}
        {!soldOut && !onSale && product.isNew && <span className="product-tag">New</span>}

        <img className="main" src={resolveImage(main)} alt={product.title} loading="lazy" />
        {hasAlt && <img className="alt" src={resolveImage(alt)} alt="" loading="lazy" />}

        {/* Quick-add button */}
        {!soldOut && (
          <button
            className={`product-qadd ${added ? 'added' : ''}`}
            onClick={handleAdd}
            aria-label={hasVariants ? 'Select options' : 'Add to bag'}
          >
            {added ? '✓ Added' : hasVariants ? 'Select size' : '+ Add'}
          </button>
        )}
      </div>
      <div className="product-name">{product.title}</div>
      <div className="product-price">
        {onSale && <span className="strike">£{product.compareAtPrice.toLocaleString('en-GB')}</span>}
        <span className="now">£{product.price.toLocaleString('en-GB')}</span>
      </div>
    </Link>
  );
}
