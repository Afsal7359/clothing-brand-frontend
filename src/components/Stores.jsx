'use client';

import { useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { realImage, resolveImage } from '@/lib/api';

export default function Craft({ craft }) {
  const [open, setOpen] = useState(false);
  // No stand-in photo: an unset craft image shows the neutral panel below.
  const image    = resolveImage(realImage(craft?.image));
  const products = craft?.products || [];

  return (
    <>
      <section className="section" style={{ background: '#fafafa' }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
          — Coming Soon
        </p>
        <h2 className="section-title" style={{ marginBottom: 28 }}>Craft</h2>

        <div style={{ maxWidth: 480 }}>
          <article
            onClick={() => setOpen(true)}
            style={{ border: '1px solid var(--line)', overflow: 'hidden', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
          >
            <div
              className={image ? undefined : 'img-skeleton'}
              style={{
                aspectRatio: '16 / 10',
                backgroundImage: image ? `url('${image}')` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </article>
        </div>
      </section>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            background: '#fff', overflowY: 'auto',
            padding: 'clamp(20px, 5vw, 60px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
              <div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>
                  — Craft
                </p>
                <h2 className="section-title">Crafted Products</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--line)', borderRadius: 2, padding: '8px 16px', cursor: 'pointer' }}
              >
                Close ✕
              </button>
            </div>

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em' }}>
                No crafted products yet.
              </div>
            ) : (
              <div className="product-grid">
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
