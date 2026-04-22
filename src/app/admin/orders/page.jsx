'use client';

import { useEffect, useState } from 'react';
import { api, resolveImage } from '@/lib/api';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter) params.status = filter;
      const res = await api.orders.list(params);
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      const updated = await api.orders.updateStatus(id, { status });
      setItems((curr) => curr.map((o) => (o._id === id ? updated : o)));
      if (selected && selected._id === id) setSelected(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const statusClass = (s) => {
    if (s === 'delivered') return 'green';
    if (s === 'cancelled') return 'red';
    if (s === 'pending') return 'amber';
    return 'blue';
  };

  return (
    <>
      <div className="admin-head">
        <h1>Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">No orders found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{o.orderNumber}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{o.shippingAddress?.fullName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{o.email}</div>
                  </td>
                  <td>{o.items.length}</td>
                  <td>₹{o.total.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12 }}>
                    <span className="badge" style={{ textTransform: 'uppercase' }}>{o.paymentMethod}</span>
                  </td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o._id, e.target.value)}
                      style={{ fontSize: 12, padding: 6, border: '1px solid var(--line)', borderRadius: 3 }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(o)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="drawer-backdrop open" onClick={() => setSelected(null)} />
          <aside className="drawer right open" style={{ width: 'min(480px, 95vw)' }}>
            <div className="drawer-head">
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Order</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>{selected.orderNumber}</div>
              </div>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ padding: '16px var(--pad)', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>Status</div>
                <span className={`badge ${statusClass(selected.status)}`} style={{ fontSize: 12, padding: '4px 10px' }}>
                  {selected.status}
                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.shippingAddress?.fullName}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{selected.email}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{selected.shippingAddress?.phone}</div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Shipping address</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
                  {selected.shippingAddress?.line1}<br />
                  {selected.shippingAddress?.line2 && <>{selected.shippingAddress.line2}<br /></>}
                  {selected.shippingAddress?.city}, {selected.shippingAddress?.state} {selected.shippingAddress?.postalCode}<br />
                  {selected.shippingAddress?.country}
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Items</div>
                {selected.items.map((it, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-2)' }}>
                    <img src={resolveImage(it.image)} alt="" style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 3 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{it.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{it.size ? `Size: ${it.size} · ` : ''}Qty: {it.quantity}</div>
                    </div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>₹{(it.price * it.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>Subtotal</span><span style={{ fontFamily: 'var(--mono)' }}>₹{selected.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>Shipping</span><span style={{ fontFamily: 'var(--mono)' }}>{selected.shippingFee === 0 ? 'Free' : `₹${selected.shippingFee}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, padding: '8px 0', borderTop: '1px solid var(--line)', marginTop: 6 }}>
                  <span>Total</span><span style={{ fontFamily: 'var(--mono)' }}>₹{selected.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {selected.notes && (
                <div style={{ marginTop: 20, padding: 14, background: '#fafafa', borderRadius: 4, fontSize: 13 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>Order notes</div>
                  {selected.notes}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--line)', padding: '16px var(--pad)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>Update status</div>
              <select
                value={selected.status}
                onChange={(e) => updateStatus(selected._id, e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid var(--line)', borderRadius: 4 }}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
