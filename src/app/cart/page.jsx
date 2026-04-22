'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { api, resolveImage } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, update, remove, clear } = useCart();
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    paymentMethod: 'cod',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);

  const shippingFee = subtotal >= 2500 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shippingFee;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setError('');
    try {
      const order = await api.orders.create({
        email: form.email,
        items: items.map((it) => ({
          product: it.productId,
          quantity: it.quantity,
          size: it.size,
        })),
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      clear();
      setPlaced(order);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Order failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <>
        <AnnounceBar />
        <Header />
        <CartDrawer />
        <section className="section" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>
            Order confirmed
          </div>
          <h1 className="section-title" style={{ marginBottom: 16 }}>Thank you.</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.7 }}>
            Your order <b>{placed.orderNumber}</b> has been placed. We've sent a confirmation to <b>{placed.email}</b>.
          </p>
          <Link href="/collections" className="btn btn-dark">Continue shopping</Link>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <section className="section">
        <div className="section-head">
          <div>
            <span className="section-subtitle">— Checkout</span>
            <h1 className="section-title">Your bag</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <p style={{ marginBottom: 20 }}>Your bag is empty.</p>
            <Link href="/collections" className="btn btn-dark">Start shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'flex-start' }}>
            <div>
              {/* Items list */}
              <div className="admin-card" style={{ marginBottom: 20, padding: 0 }}>
                {items.map((it, i) => (
                  <div key={i} className="cart-item" style={{ padding: 16, borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line)' }}>
                    <img src={resolveImage(it.image)} alt={it.title} />
                    <div>
                      <div className="cart-item-title">{it.title}</div>
                      <div className="cart-item-meta">
                        {it.size ? `Size: ${it.size} · ` : ''}₹{it.price.toLocaleString('en-IN')}
                      </div>
                      <div className="qty">
                        <button onClick={() => update(i, it.quantity - 1)}>−</button>
                        <span>{it.quantity}</span>
                        <button onClick={() => update(i, it.quantity + 1)}>+</button>
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

              {/* Checkout form */}
              <form onSubmit={handleSubmit} className="admin-card">
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, textTransform: 'uppercase', marginBottom: 18 }}>
                  Shipping details
                </h3>

                <div className="field">
                  <label>Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Full name</label>
                    <input name="fullName" value={form.fullName} onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required />
                  </div>
                </div>
                <div className="field">
                  <label>Address line 1</label>
                  <input name="line1" value={form.line1} onChange={handleChange} required />
                </div>
                <div className="field">
                  <label>Address line 2 (optional)</label>
                  <input name="line2" value={form.line2} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label>State</label>
                    <input name="state" value={form.state} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Postal code</label>
                    <input name="postalCode" value={form.postalCode} onChange={handleChange} required />
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <input name="country" value={form.country} onChange={handleChange} required />
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, textTransform: 'uppercase', margin: '24px 0 18px' }}>
                  Payment
                </h3>
                <div className="field">
                  <label>Method</label>
                  <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                  <p className="hint">For demo purposes. Plug Razorpay/Stripe into the backend to enable real payments.</p>
                </div>
                <div className="field">
                  <label>Order notes (optional)</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
                </div>

                {error && <div className="err">{error}</div>}
                <button type="submit" className="btn btn-dark" disabled={submitting} style={{ width: '100%', justifyContent: 'center', padding: 16, marginTop: 12 }}>
                  {submitting ? 'Placing order…' : `Place order · ₹${total.toLocaleString('en-IN')}`}
                </button>
              </form>
            </div>

            {/* Order summary */}
            <aside className="admin-card" style={{ position: 'sticky', top: 90 }}>
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, textTransform: 'uppercase', marginBottom: 14 }}>
                Summary
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span>Subtotal</span>
                <span className="mono" style={{ fontFamily: 'var(--mono)' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span>Shipping</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 600, paddingTop: 14, borderTop: '1px solid var(--line)', marginTop: 14 }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--mono)' }}>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 14 }}>
                Taxes included. Free shipping on orders above ₹2,500.
              </p>
            </aside>
          </div>
        )}
      </section>

      <Footer />

      <style jsx>{`
        @media (max-width: 900px) {
          section.section > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          aside.admin-card { position: static !important; }
        }
      `}</style>
    </>
  );
}
