'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { resolveImage } from '@/lib/api';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const PAGE_SIZE = 20;

function ProductCard({ product }) {
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
      window.location.href = `/product/${product.slug}`;
      return;
    }
    add({ productId: product._id, title: product.title, price: product.price, image: main, size: '', quantity: 1 });
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
        {!soldOut && (
          <button className={`product-qadd ${added ? 'added' : ''}`} onClick={handleAdd} aria-label="Add to bag">
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

export default function InfiniteProductGrid({ category, collectionSlug, initialItems = [], initialTotal = 0 }) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialItems.length >= initialTotal && initialTotal >= 0);
  const sentinelRef = useRef(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || done) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ page: nextPage, limit: PAGE_SIZE, status: 'active' });
      if (category && category !== 'all') params.set('category', category);
      if (collectionSlug) params.set('collectionSlug', collectionSlug);
      const res = await fetch(`${API_URL}/products?${params}`);
      const data = await res.json();
      const newItems = data.items || [];
      setItems((prev) => {
        const combined = [...prev, ...newItems];
        if (combined.length >= data.total) setDone(true);
        return combined;
      });
      setPage(nextPage);
      setTotal(data.total);
    } catch (err) {
      console.error('loadMore error', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [done, page, category, collectionSlug]);

  // Reset on category/collection change
  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setTotal(initialTotal);
    setDone(initialItems.length >= initialTotal && initialTotal >= 0);
  }, [category, collectionSlug]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        No products found
      </div>
    );
  }

  return (
    <div>
      <div className="product-grid">
        {items.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />

      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--ink-soft)' }}>
          LOADING…
        </div>
      )}

      {done && total > 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
          — {total} product{total !== 1 ? 's' : ''} —
        </div>
      )}
    </div>
  );
}
