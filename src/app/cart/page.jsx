'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { resolveImage } from '@/lib/api';
import { track } from '@/lib/tracker';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

/* ── Coupon input ─────────────────────────────────────────────────────────── */
function CouponInput({ subtotal, onApply }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [applied, setApplied] = useState(null);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true); setErr('');
    try {
      const res = await fetch(`${API_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, orderAmount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setApplied(data);
      onApply(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = () => { setApplied(null); setCode(''); setErr(''); onApply(null); };

  if (applied) {
    return (
      <div className="coupon-applied">
        <span>🎉 <b>{applied.code}</b> — £{applied.discount} off</span>
        <button onClick={remove} className="coupon-remove">×</button>
      </div>
    );
  }

  return (
    <div className="coupon-row">
      <input
        type="text"
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
      />
      <button onClick={apply} disabled={loading}>{loading ? '…' : 'Apply'}</button>
      {err && <p className="coupon-err">{err}</p>}
    </div>
  );
}

/* ── Stripe payment form ──────────────────────────────────────────────────── */
function StripeForm({ onSuccess, total, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setErr('');

    const { error: submitErr } = await elements.submit();
    if (submitErr) { setErr(submitErr.message); setLoading(false); return; }

    try {
      const intentRes = await fetch(`${API_URL}/stripe/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, currency: 'gbp' }),
      });
      const { clientSecret, paymentIntentId } = await intentRes.json();

      const { error: confirmErr } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: window.location.origin + '/cart?success=1' },
        redirect: 'if_required',
      });
      if (confirmErr) { setErr(confirmErr.message); setLoading(false); return; }

      await onSuccess(paymentIntentId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}
      <button type="submit" className="btn btn-dark" disabled={loading || disabled || !stripe}
        style={{ width: '100%', justifyContent: 'center', padding: 16, marginTop: 16 }}>
        {loading ? 'Processing…' : `Pay £${total?.toLocaleString('en-GB')}`}
      </button>
    </form>
  );
}

/* ── Main cart page ───────────────────────────────────────────────────────── */
export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, update, remove, clear } = useCart();
  const { user, loading: userLoading, userToken } = useUser();

  const [form, setForm] = useState({
    fullName: '', phone: '',
    line1: '', line2: '', city: '', state: '', postalCode: '', country: 'United Kingdom',
    notes: '',
  });
  const [shippingDone, setShippingDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [coupon, setCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState('');

  // Auth gate — redirect to login if not signed in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login?redirect=/cart');
    }
  }, [user, userLoading, router]);

  // Track checkout_start when user lands on cart with items
  useEffect(() => {
    if (!userLoading && user && items.length > 0) {
      track('checkout_start', '/cart', { itemCount: items.length, subtotal });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading]);

  const shippingFee = subtotal >= 250 || subtotal === 0 ? 0 : 3.99;
  const couponDiscount = coupon?.discount || 0;
  const total = Math.max(0, subtotal + shippingFee - couponDiscount);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const validateShipping = () => {
    const required = { fullName: 'Full name', phone: 'Phone', line1: 'Address', city: 'City', postalCode: 'Postal code' };
    const errors = {};
    for (const [key, label] of Object.entries(required)) {
      if (!form[key]?.trim()) errors[key] = `${label} is required`;
    }
    const ukPostcode = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    if (form.postalCode && !ukPostcode.test(form.postalCode.trim())) {
      errors.postalCode = 'Enter a valid UK postcode (e.g. SW1A 1AA)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const confirmShipping = () => {
    if (validateShipping()) setShippingDone(true);
  };

  const buildOrderPayload = (paymentIntentId = '') => ({
    items: items.map((it) => ({ product: it.productId, quantity: it.quantity, size: it.size })),
    shippingAddress: {
      fullName: form.fullName, phone: form.phone,
      line1: form.line1, line2: form.line2,
      city: form.city, state: form.state,
      postalCode: form.postalCode, country: form.country,
    },
    paymentMethod,
    notes: form.notes,
    couponCode: coupon?.code || '',
    paymentIntentId,
    total,
  });

  const placeOrder = async (paymentIntentId = '') => {
    const token = userToken?.();
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-token': `Bearer ${token}` },
      body: JSON.stringify(buildOrderPayload(paymentIntentId)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order failed');
    track('purchase', '/cart', { orderNumber: data.orderNumber, total, itemCount: items.length });
    clear();
    setPlaced(data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCodSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true); setError('');
    try { await placeOrder(); } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (paymentMethod !== 'card' || total <= 0) { setStripeClientSecret(''); return; }
    let cancelled = false;
    fetch(`${API_URL}/stripe/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: total, currency: 'gbp' }),
    }).then((r) => r.json()).then((d) => {
      if (!cancelled) setStripeClientSecret(d.clientSecret || '');
    }).catch(() => { });
    return () => { cancelled = true; };
  }, [paymentMethod, total]);

  // Loading or redirecting
  if (userLoading || (!user && typeof window !== 'undefined')) {
    return (
      <>
        <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader">Loading…</div>
        </div>
        <Footer />
      </>
    );
  }

  if (placed) {
    return (
      <>
        <section className="section" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>
            Order confirmed
          </div>
          <h1 className="section-title" style={{ marginBottom: 16 }}>Thank you.</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 8, lineHeight: 1.7 }}>
            Your order <b>{placed.orderNumber}</b> has been placed.
          </p>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 24, lineHeight: 1.7 }}>
            A confirmation has been sent to <b>{user?.email}</b>.
          </p>
          <Link href="/account" className="btn btn-dark" style={{ marginRight: 12 }}>View orders</Link>
          <Link href="/collections/all" className="btn">Continue shopping</Link>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>

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
            <Link href="/collections/all" className="btn btn-dark">Start shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div>
              {/* Items */}
              <div className="admin-card" style={{ marginBottom: 20, padding: 0 }}>
                {items.map((it, i) => (
                  <div key={i} className="cart-item" style={{ padding: 16, borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line)' }}>
                    <img src={resolveImage(it.image)} alt={it.title} />
                    <div>
                      <div className="cart-item-title">{it.title}</div>
                      <div className="cart-item-meta">{it.size ? `Size: ${it.size} · ` : ''}£{it.price.toLocaleString('en-GB')}</div>
                      <div className="qty">
                        <button onClick={() => update(i, it.quantity - 1)}>−</button>
                        <span>{it.quantity}</span>
                        <button onClick={() => update(i, it.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 500, marginBottom: 8 }}>£{(it.price * it.quantity).toLocaleString('en-GB')}</div>
                      <button className="cart-remove" onClick={() => remove(i)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── STEP 1: Shipping ── */}
              <div className="admin-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, textTransform: 'uppercase', margin: 0 }}>
                    {shippingDone ? '✓ Shipping details' : 'Shipping details'}
                  </h3>
                  {shippingDone && (
                    <button
                      type="button"
                      onClick={() => setShippingDone(false)}
                      style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--line)', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}
                    >Edit</button>
                  )}
                </div>

                {shippingDone ? (
                  /* Confirmed summary */
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{form.fullName} · {form.phone}</div>
                    <div>{form.line1}{form.line2 ? `, ${form.line2}` : ''}</div>
                    <div>{form.city}{form.state ? `, ${form.state}` : ''} · {form.postalCode}</div>
                    <div>{form.country}</div>
                  </div>
                ) : (
                  /* Editable form */
                  <>
                    {/* Logged-in user info banner */}
                    <div className="checkout-user-banner" style={{ marginBottom: 18 }}>
                      {user?.avatar
                        ? <img src={user.avatar} alt="" className="checkout-user-avatar" />
                        : <div className="checkout-user-initial">{user?.name?.[0]?.toUpperCase() || '?'}</div>}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{user?.email}</div>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="field">
                        <label>Full name *</label>
                        <input name="fullName" value={form.fullName} onChange={handleChange} />
                        {fieldErrors.fullName && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>{fieldErrors.fullName}</span>}
                      </div>
                      <div className="field">
                        <label>Phone *</label>
                        <input
                          name="phone" type="tel" value={form.phone}
                          onChange={(e) => { setForm((f) => ({ ...f, phone: e.target.value.replace(/[^\d\s\+\-\(\)]/g, '') })); if (fieldErrors.phone) setFieldErrors((fe) => ({ ...fe, phone: '' })); }}
                          placeholder="07700 900123"
                        />
                        {fieldErrors.phone && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>{fieldErrors.phone}</span>}
                      </div>
                    </div>
                    <div className="field">
                      <label>Address line 1 *</label>
                      <input name="line1" value={form.line1} onChange={handleChange} />
                      {fieldErrors.line1 && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>{fieldErrors.line1}</span>}
                    </div>
                    <div className="field">
                      <label>Address line 2 (optional)</label>
                      <input name="line2" value={form.line2} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label>City *</label>
                        <input name="city" value={form.city} onChange={handleChange} />
                        {fieldErrors.city && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>{fieldErrors.city}</span>}
                      </div>
                      <div className="field">
                        <label>County</label>
                        <input name="state" value={form.state} onChange={handleChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label>Postal code *</label>
                        <input
                          name="postalCode" value={form.postalCode} placeholder="e.g. SW1A 1AA"
                          onChange={(e) => { setForm((f) => ({ ...f, postalCode: e.target.value.toUpperCase().replace(/[^A-Z0-9\s]/g, '') })); if (fieldErrors.postalCode) setFieldErrors((fe) => ({ ...fe, postalCode: '' })); }}
                        />
                        {fieldErrors.postalCode && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3, display: 'block' }}>{fieldErrors.postalCode}</span>}
                      </div>
                      <div className="field">
                        <label>Country</label>
                        <input value={form.country} readOnly style={{ background: 'var(--surface, #f9f9f9)', cursor: 'not-allowed', color: 'var(--ink-soft)' }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={confirmShipping}
                      style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 8 }}
                    >
                      Continue to payment →
                    </button>
                  </>
                )}
              </div>

              {/* ── STEP 2: Payment (only shown after shipping confirmed) ── */}
              {shippingDone && (
              <div className="admin-card">
                <h3 style={{ fontFamily: 'var(--display)', fontSize: 22, textTransform: 'uppercase', marginBottom: 16 }}>Payment</h3>
                <div className="payment-tiles">
                  <button
                    type="button"
                    className={`payment-tile${paymentMethod === 'cod' ? ' active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" strokeLinecap="round"/>
                      <path d="M6 15h4" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <div className="payment-tile-title">Cash on Delivery</div>
                      <div className="payment-tile-sub">Pay when your order arrives</div>
                    </div>
                    <div className="payment-tile-radio" />
                  </button>

                  <button
                    type="button"
                    className={`payment-tile${paymentMethod === 'card' ? ' active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" strokeLinecap="round"/>
                      <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
                    </svg>
                    <div>
                      <div className="payment-tile-title">Pay by Card</div>
                      <div className="payment-tile-sub">Visa, Mastercard & more via Stripe</div>
                    </div>
                    <div className="payment-tile-radio" />
                  </button>
                </div>

                {paymentMethod === 'cod' && (
                  <>
                    <div className="field" style={{ marginTop: 20 }}>
                      <label>Order notes (optional)</label>
                      <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} />
                    </div>
                    {error && <div className="err">{error}</div>}
                    <button onClick={handleCodSubmit} className="btn btn-dark" disabled={submitting}
                      data-track="checkout-confirm-cod"
                      style={{ width: '100%', justifyContent: 'center', padding: 16, marginTop: 12 }}>
                      {submitting ? 'Placing order…' : `Confirm order · £${total.toLocaleString('en-GB')}`}
                    </button>
                  </>
                )}

                {paymentMethod === 'card' && stripeClientSecret && (
                  <div style={{ marginTop: 20 }}>
                    <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe' } }}>
                      <StripeForm onSuccess={placeOrder} total={total} disabled={submitting} />
                    </Elements>
                  </div>
                )}
                {paymentMethod === 'card' && !stripeClientSecret && (
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)', padding: '16px 0' }}>Loading payment form…</p>
                )}
              </div>
              )} {/* end shippingDone */}
            </div>

            {/* Summary sidebar */}
            <aside className="admin-card cart-summary">
              <h3 style={{ fontFamily: 'var(--display)', fontSize: 20, textTransform: 'uppercase', marginBottom: 14 }}>Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span style={{ fontFamily: 'var(--mono)' }}>£{subtotal.toLocaleString('en-GB')}</span></div>
              <div className="summary-row"><span>Shipping</span><span style={{ fontFamily: 'var(--mono)' }}>{shippingFee === 0 ? 'Free' : `£${shippingFee}`}</span></div>
              {couponDiscount > 0 && (
                <div className="summary-row" style={{ color: '#16a34a' }}>
                  <span>Coupon ({coupon.code})</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>−£{couponDiscount.toLocaleString('en-GB')}</span>
                </div>
              )}
              <div className="summary-row summary-total">
                <span>Total</span>
                <span style={{ fontFamily: 'var(--mono)' }}>£{total.toLocaleString('en-GB')}</span>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <CouponInput subtotal={subtotal} onApply={setCoupon} />
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 14 }}>
                Taxes included. Free shipping on orders above £250.
              </p>
            </aside>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
