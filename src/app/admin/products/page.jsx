'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, resolveImage } from '@/lib/api';

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, status: 'active' };
      if (q) params.q = q;
      if (category) params.category = category;
      const res = await api.products.list(params);
      setItems(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.products.remove(id);
      setItems((curr) => curr.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="admin-head">
        <h1>Products</h1>
        <Link href="/admin/products/new" className="btn btn-dark btn-sm">+ New product</Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px auto', gap: 10 }}>
          <input placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4 }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4 }}>
            <option value="">All categories</option>
            <option value="tshirts">T-shirts</option>
            <option value="hoodies">Hoodies</option>
            <option value="jackets">Jackets</option>
            <option value="shirts">Shirts</option>
            <option value="polos">Polos</option>
            <option value="caps">Caps</option>
            <option value="pants">Pants</option>
            <option value="shorts">Shorts</option>
          </select>
          <button className="btn btn-dark btn-sm" onClick={load}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: 14 }}>No products yet.</p>
          <Link href="/admin/products/new" className="btn btn-dark btn-sm">Create the first one</Link>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}></th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const stock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                return (
                  <tr key={p._id}>
                    <td>{p.images?.[0] && <img src={resolveImage(p.images[0])} alt="" />}</td>
                    <td>
                      <Link href={`/admin/products/${p._id}/edit`} style={{ fontWeight: 500 }}>{p.title}</Link>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--mono)' }}>{p.slug}</div>
                    </td>
                    <td>{p.category}</td>
                    <td>₹{p.price.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${stock > 0 ? 'green' : 'red'}`}>{stock}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'green' : 'amber'}`}>{p.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/admin/products/${p._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                        <button className="btn-sm" onClick={() => handleDelete(p._id)} style={{ color: '#991b1b', border: '1px solid var(--line)', borderRadius: 4, padding: '0 12px' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
