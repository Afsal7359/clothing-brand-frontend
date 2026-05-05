'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const EMPTY = {
  code: '', description: '', type: 'percentage', value: '',
  minOrderAmount: '', maxDiscountAmount: '', maxUses: '',
  startDate: '', expiryDate: '', isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); // coupon id or null
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setCoupons(await api.coupons.list()); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); setErr(''); };

  const openEdit = (c) => {
    setForm({
      code: c.code || '',
      description: c.description || '',
      type: c.type || 'percentage',
      value: c.value ?? '',
      minOrderAmount: c.minOrderAmount ?? '',
      maxDiscountAmount: c.maxDiscountAmount ?? '',
      maxUses: c.maxUses ?? '',
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
      isActive: c.isActive,
    });
    setEditing(c._id);
    setShowForm(true);
    setErr('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount !== '' ? Number(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount !== '' ? Number(form.maxDiscountAmount) : undefined,
        maxUses: form.maxUses !== '' ? Number(form.maxUses) : null,
        startDate: form.startDate || null,
        expiryDate: form.expiryDate || null,
      };
      if (editing) await api.coupons.update(editing, payload);
      else await api.coupons.create(payload);
      setShowForm(false);
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.coupons.remove(id); await load(); } catch { /* ignore */ }
  };

  const handleToggle = async (c) => {
    try { await api.coupons.update(c._id, { isActive: !c.isActive }); await load(); } catch { /* ignore */ }
  };

  return (
    <div>
        <div className="admin-topbar">
          <h1 className="admin-page-title">Coupons</h1>
          <button className="btn btn-dark" onClick={openNew}>+ New coupon</button>
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 20, textTransform: 'uppercase', marginBottom: 20 }}>
              {editing ? 'Edit coupon' : 'Create coupon'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="field">
                  <label>Code *</label>
                  <input name="code" value={form.code} onChange={handleChange} required placeholder="SUMMER20" style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="field">
                  <label>Type *</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Value * {form.type === 'percentage' ? '(%)' : '(₹)'}</label>
                  <input type="number" name="value" value={form.value} onChange={handleChange} required min={0} step="0.01" />
                </div>
                {form.type === 'percentage' && (
                  <div className="field">
                    <label>Max discount cap (₹)</label>
                    <input type="number" name="maxDiscountAmount" value={form.maxDiscountAmount} onChange={handleChange} min={0} placeholder="Leave empty for no cap" />
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Min order amount (₹)</label>
                  <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} min={0} />
                </div>
                <div className="field">
                  <label>Max uses</label>
                  <input type="number" name="maxUses" value={form.maxUses} onChange={handleChange} min={1} placeholder="Leave empty for unlimited" />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Start date</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                </div>
                <div className="field">
                  <label>Expiry date</label>
                  <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="Internal note" />
              </div>
              <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} id="isActive" />
                <label htmlFor="isActive" style={{ marginBottom: 0 }}>Active</label>
              </div>

              {err && <div className="err">{err}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-dark" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>Loading…</p>
        ) : (
          <div className="admin-card" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Used / Max</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--ink-soft)' }}>No coupons yet</td></tr>
                )}
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td><b style={{ fontFamily: 'var(--mono)' }}>{c.code}</b>
                      {c.description && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{c.description}</div>}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{c.type}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>
                      {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                      {c.maxDiscountAmount && <span style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'block' }}>max ₹{c.maxDiscountAmount}</span>}
                      {c.minOrderAmount > 0 && <span style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'block' }}>min ₹{c.minOrderAmount}</span>}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)' }}>
                      {c.usedCount} / {c.maxUses ?? '∞'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(c)}
                        style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', border: `1px solid ${c.isActive ? '#16a34a' : '#dc2626'}`, color: c.isActive ? '#16a34a' : '#dc2626', background: 'none', cursor: 'pointer', borderRadius: 2 }}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn" style={{ padding: '4px 12px', fontSize: 12, color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleDelete(c._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
