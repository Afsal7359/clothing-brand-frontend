'use client';

import { useEffect, useState } from 'react';
import { api, resolveImage } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function compressImage(file, maxW = 1400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadOne(file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
  const compressed = await compressImage(file);
  const fd = new FormData();
  fd.append('files', compressed);
  const res = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.urls?.[0] || '';
}

const EMPTY = {
  title: '',
  description: '',
  eyebrow: '',
  desktopImage: '',
  mobileImage: '',
  order: 0,
  isFeatured: true,
  isActive: true,
};

export default function AdminCollectionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null or collection object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.collections.list({ active: 'false' });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing({});
    setForm(EMPTY);
  };

  const startEdit = (c) => {
    setEditing(c);
    setForm({ ...EMPTY, ...c });
  };

  const cancel = () => {
    setEditing(null);
    setForm(EMPTY);
    setErr('');
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadOne(file);
      setField(field, url);
    } catch (error) {
      setErr(error.message);
    }
    e.target.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editing?._id) {
        const updated = await api.collections.update(editing._id, payload);
        setItems((curr) => curr.map((c) => c._id === editing._id ? updated : c));
      } else {
        const created = await api.collections.create(payload);
        setItems((curr) => [created, ...curr]);
      }
      cancel();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this collection?')) return;
    try {
      await api.collections.remove(id);
      setItems((curr) => curr.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Collections</h1>
        <button className="btn btn-dark btn-sm" onClick={startNew}>+ New collection</button>
      </div>

      {editing !== null && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>
            {editing?._id ? 'Edit collection' : 'New collection'}
          </h3>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="field">
                <label>Title</label>
                <input value={form.title} onChange={(e) => setField('title', e.target.value)} required />
              </div>
              <div className="field">
                <label>Eyebrow label</label>
                <input value={form.eyebrow} onChange={(e) => setField('eyebrow', e.target.value)} placeholder="Summer Edit" />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Desktop image (wide crop)</label>
                {form.desktopImage && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={resolveImage(form.desktopImage)} alt="" style={{ width: '100%', maxWidth: 240, borderRadius: 4 }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'desktopImage')} />
              </div>
              <div className="field">
                <label>Mobile image (portrait)</label>
                {form.mobileImage && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={resolveImage(form.mobileImage)} alt="" style={{ width: '100%', maxWidth: 160, borderRadius: 4 }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'mobileImage')} />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Display order</label>
                <input type="number" value={form.order} onChange={(e) => setField('order', e.target.value)} />
              </div>
              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
                  Featured on homepage
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)' }}>
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
                  Active (visible on site)
                </label>
              </div>
            </div>

            {err && <div className="err">{err}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="submit" className="btn btn-dark btn-sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={cancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loader">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: 14 }}>No collections yet.</p>
          <button className="btn btn-dark btn-sm" onClick={startNew}>Create the first one</button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Title</th>
                <th>Eyebrow</th>
                <th>Order</th>
                <th>Featured</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td>{c.desktopImage && <img src={resolveImage(c.desktopImage)} alt="" />}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--mono)' }}>{c.slug}</div>
                  </td>
                  <td>{c.eyebrow || '—'}</td>
                  <td>{c.order}</td>
                  <td><span className={`badge ${c.isFeatured ? 'green' : ''}`}>{c.isFeatured ? 'Yes' : 'No'}</span></td>
                  <td><span className={`badge ${c.isActive ? 'green' : 'red'}`}>{c.isActive ? 'Yes' : 'No'}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>Edit</button>
                      <button className="btn-sm" onClick={() => handleDelete(c._id)} style={{ color: '#991b1b', border: '1px solid var(--line)', borderRadius: 4, padding: '0 12px' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
