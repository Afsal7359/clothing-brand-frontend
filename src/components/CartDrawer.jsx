'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { resolveImage } from '@/lib/api';

export default function CartDrawer() {
  const { items, subtotal, update, remove, drawerOpen, setDrawerOpen } = useCart();
  const close = () => setDrawerOpen(false);

  return (
    <>
      <div className={`drawer-backdrop ${drawerOpen ? 'open' : ''}`} onClick={close} />
      <aside className={`drawer right ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="drawer-head">
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              Your bag ({items.length})
            </div>
          </div>
          <button className="drawer-close" onClick={close} aria-label="Close cart">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p style={{ marginBottom: 16, fontSize: 15 }}>Your bag is empty.</p>
            <Link href="/collections" className="btn btn-dark" onClick={close}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((it, i) => (
                <div className="cart-item" key={i}>
                  <img src={resolveImage(it.image)} alt={it.title} />
                  <div>
                    <div className="cart-item-title">{it.title}</div>
                    <div className="cart-item-meta">
                      {it.size ? `Size: ${it.size} · ` : ''}₹{it.price.toLocaleString('en-IN')}
                    </div>
                    <div className="qty">
                      <button onClick={() => update(i, it.quantity - 1)} aria-label="Decrease">−</button>
                      <span>{it.quantity}</span>
                      <button onClick={() => update(i, it.quantity + 1)} aria-label="Increase">+</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                    </div>
                    <button className="cart-remove" onClick={() => remove(i)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-foot">
              <div className="cart-total">
                <span>Subtotal</span>
                <span className="mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginBottom: 14 }}>
                Shipping & taxes calculated at checkout.
              </p>
              <Link href="/cart" onClick={close} className="btn btn-dark" style={{ width: '100%', justifyContent: 'center' }}>
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
