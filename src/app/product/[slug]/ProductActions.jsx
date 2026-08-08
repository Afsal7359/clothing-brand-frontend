'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function ProductActions({ product }) {
  const { add } = useCart();
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [err, setErr] = useState('');

  const variants = product.variants || [];
  const colors = (product.colors || []).filter(Boolean);
  const hasVariants = variants.length > 0;
  const hasColors = colors.length > 0;

  const handleAdd = () => {
    // Both choices are required when offered, so the picked combination is
    // what reaches the cart, the order, and the packing list.
    if (hasVariants && !size) { setErr('Please select a size'); return; }
    if (hasColors && !color)  { setErr('Please select a colour'); return; }
    setErr('');
    add({
      productId: product._id,
      title: product.title,
      price: product.price,
      image: product.images?.[0],
      size: size || '',
      color: color || '',
      quantity: 1,
    });
  };

  return (
    <>
      {hasColors && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            Colour{color ? <span style={{ color: 'var(--ink)' }}> — {color}</span> : ''}
          </div>
          <div className="size-list" style={{ marginBottom: 18 }}>
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                className={`size-chip ${color === c ? 'active' : ''}`}
                onClick={() => { setColor(c); setErr(''); }}
                aria-pressed={color === c}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {hasVariants && (
        <>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            Size
          </div>
          <div className="size-list">
            {variants.map((v) => (
              <button
                type="button"
                key={v._id || v.size}
                className={`size-chip ${size === v.size ? 'active' : ''}`}
                onClick={() => { setSize(v.size); setErr(''); }}
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
        <button type="button" className="btn btn-dark" onClick={handleAdd}>
          Add to bag
        </button>
      </div>
      {err && <div className="err">{err}</div>}
    </>
  );
}
