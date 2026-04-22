'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function ProductActions({ product }) {
  const { add } = useCart();
  const [size, setSize] = useState(null);
  const [err, setErr] = useState('');

  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const handleAdd = () => {
    if (hasVariants && !size) {
      setErr('Please select a size');
      return;
    }
    setErr('');
    add({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0],
      size: size || '',
      quantity: 1,
    });
  };

  return (
    <>
      {hasVariants && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            Size
          </div>
          <div className="size-list">
            {variants.map((v) => (
              <button
                key={v._id || v.size}
                className={`size-chip ${size === v.size ? 'active' : ''}`}
                onClick={() => setSize(v.size)}
                disabled={v.stock <= 0}
                aria-label={`Size ${v.size}${v.stock <= 0 ? ' sold out' : ''}`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="pdp-cta">
        <button className="btn btn-dark" onClick={handleAdd}>
          Add to bag
        </button>
      </div>
      {err && <div className="err">{err}</div>}
    </>
  );
}
