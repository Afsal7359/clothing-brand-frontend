'use client';

import { useEffect, useState } from 'react';
import { api, resolveImage } from '@/lib/api';
import Pagination from '@/components/Pagination';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR = {
  pending: '#d97706', confirmed: '#2563eb', processing: '#7c3aed',
  shipped: '#0891b2', delivered: '#16a34a', cancelled: '#dc2626',
  paid: '#16a34a', failed: '#dc2626', refunded: '#7c3aed',
};

const PAGE_SIZE = 50;

export default function AdminOrdersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [trackMsg, setTrackMsg] = useState('');
  const [trackLoc, setTrackLoc] = useState('');

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, page: pg };
      if (filter) params.status = filter;
      const res = await api.orders.list(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const goPage = (p) => { setPage(p); load(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => { setPage(1); load(1); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      const updated = await api.orders.updateStatus(id, { status, trackingMessage: trackMsg, trackingLocation: trackLoc });
      setItems((curr) => curr.map((o) => (o._id === id ? updated : o)));
      if (selected?._id === id) setSelected(updated);
      setTrackMsg(''); setTrackLoc('');
    } catch (err) {
      alert(err.message);
    }
  };

  // Load full order detail when drawer opens (includes trackingEvents)
  const openOrder = async (o) => {
    setSelected(o);
    try {
      const full = await api.orders.get(o._id);
      setSelected(full);
    } catch { /* show what we have */ }
  };

  return (
    <div>
        <div className="admin-topbar">
          <h1 className="admin-page-title">Orders</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>Loading…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="admin-card" style={{ padding: 0 }}>
            <div className="admin-table-wrap"><table className="admin-table">
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
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.shippingAddress?.fullName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{o.email}</div>
                    </td>
                    <td>{o.items.length}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>£{o.total.toLocaleString('en-GB')}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '3px 8px', border: `1px solid ${STATUS_COLOR[o.paymentStatus] || '#888'}`, color: STATUS_COLOR[o.paymentStatus] || '#888', borderRadius: 2 }}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)}
                        style={{ fontSize: 12, padding: 6, border: '1px solid var(--line)', borderRadius: 3 }}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => openOrder(o)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        )}

        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={goPage} label="orders" />

        {/* Detail drawer */}
        {selected && (
          <>
            <div className="drawer-backdrop open" onClick={() => setSelected(null)} />
            <aside className="drawer right open" style={{ width: 'min(520px, 95vw)' }}>
              <div className="drawer-head">
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Order</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 500 }}>{selected.orderNumber}</div>
                </div>
                <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div style={{ padding: '16px var(--pad)', overflowY: 'auto', flex: 1 }}>
                {/* Customer info */}
                <div style={{ marginBottom: 20 }}>
                  <div className="drawer-label">Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.shippingAddress?.fullName}</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{selected.email} · {selected.shippingAddress?.phone}</div>
                  {selected.user && (
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>
                      Registered user: {selected.user.name || selected.user.email}
                      {selected.user.deviceInfo?.length > 0 && (
                        <span style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: 10 }}>
                          {selected.user.deviceInfo[selected.user.deviceInfo.length - 1]?.browser} /
                          {selected.user.deviceInfo[selected.user.deviceInfo.length - 1]?.os} /
                          {selected.user.deviceInfo[selected.user.deviceInfo.length - 1]?.device}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipping address */}
                <div style={{ marginBottom: 20 }}>
                  <div className="drawer-label">Address</div>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
                    {selected.shippingAddress?.line1}
                    {selected.shippingAddress?.line2 && <>, {selected.shippingAddress.line2}</>}<br />
                    {selected.shippingAddress?.city}, {selected.shippingAddress?.state} {selected.shippingAddress?.postalCode}<br />
                    {selected.shippingAddress?.country}
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 20 }}>
                  <div className="drawer-label">Items</div>
                  {selected.items.map((it, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                      {it.image && <img src={resolveImage(it.image)} alt="" style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 2 }} />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{it.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{it.size ? `Size: ${it.size} · ` : ''}Qty: {it.quantity}</div>
                      </div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>£{(it.price * it.quantity).toLocaleString('en-GB')}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ marginBottom: 20, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Subtotal</span><span style={{ fontFamily: 'var(--mono)' }}>£{selected.subtotal?.toLocaleString('en-GB')}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span>Shipping</span><span style={{ fontFamily: 'var(--mono)' }}>{selected.shippingFee === 0 ? 'Free' : `£${selected.shippingFee}`}</span></div>
                  {selected.couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#16a34a' }}>
                      <span>Coupon ({selected.couponCode})</span>
                      <span style={{ fontFamily: 'var(--mono)' }}>−£{selected.couponDiscount?.toLocaleString('en-GB')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 15, padding: '8px 0', borderTop: '1px solid var(--line)', marginTop: 4 }}>
                    <span>Total</span><span style={{ fontFamily: 'var(--mono)' }}>£{selected.total?.toLocaleString('en-GB')}</span>
                  </div>
                </div>

                {/* Tracking timeline */}
                {selected.trackingEvents?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div className="drawer-label">Tracking timeline</div>
                    <div className="tracking-timeline">
                      {[...selected.trackingEvents].reverse().map((ev, i) => (
                        <div key={i} className={`tracking-event ${i === 0 ? 'is-latest' : ''}`}>
                          <div className="tracking-dot" />
                          <div className="tracking-content">
                            <div style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 13 }}>{ev.status}</div>
                            {ev.message && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ev.message}</div>}
                            {ev.location && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>📍 {ev.location}</div>}
                            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2, fontFamily: 'var(--mono)' }}>
                              {new Date(ev.timestamp).toLocaleString('en-GB')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div style={{ marginBottom: 20, padding: 14, background: '#fafafa', borderRadius: 4, fontSize: 13 }}>
                    <div className="drawer-label">Notes</div>
                    {selected.notes}
                  </div>
                )}
              </div>

              {/* Update status */}
              <div style={{ borderTop: '1px solid var(--line)', padding: '16px var(--pad)' }}>
                <div className="drawer-label">Update status</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input placeholder="Tracking message (optional)" value={trackMsg} onChange={(e) => setTrackMsg(e.target.value)} style={{ flex: 1, padding: 8, border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }} />
                  <input placeholder="Location" value={trackLoc} onChange={(e) => setTrackLoc(e.target.value)} style={{ width: 120, padding: 8, border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }} />
                </div>
                <select value={selected.status} onChange={(e) => updateStatus(selected._id, e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid var(--line)', borderRadius: 4 }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </aside>
          </>
        )}
    </div>
  );
}
