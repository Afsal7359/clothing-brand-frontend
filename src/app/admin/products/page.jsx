'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, resolveImage } from '@/lib/api';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 30;

export default function AdminProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  // 'all' so drafts and archived products are visible here — the storefront
  // still only shows active ones.
  const [status, setStatus] = useState('all');

  const load = async (pg = page, st = status, term = q) => {
    setLoading(true);
    try {
      const params = { limit: PAGE_SIZE, page: pg, status: st };
      if (term) params.q = term;
      const res = await api.products.list(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, []);

  const handleSearch = () => { setPage(1); load(1, status, q); };
  const goPage = (p) => { setPage(p); load(p, status, q); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const changeStatus = (st) => { setStatus(st); setPage(1); load(1, st, q); };

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
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/products/bulk" className="btn btn-sm">↑ Bulk upload</Link>
          <Link href="/admin/products/new" className="btn btn-dark btn-sm">+ New product</Link>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-filters">
          <input
            placeholder="Search by title or barcode…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4, minWidth: 0 }}
          />
          <select value={status} onChange={(e) => changeStatus(e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4 }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button className="btn btn-dark btn-sm" onClick={handleSearch}>Search</button>
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
                <th>Barcode</th>
                <th>Collection</th>
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
                    <td>
                      {p.barcode ? (
                        <code style={{ fontFamily: 'var(--mono)', fontSize: 11.5, letterSpacing: 0.3 }}>{p.barcode}</code>
                      ) : (
                        <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {(p.collections || []).length
                        ? (p.collections || []).map((c) => c.title).filter(Boolean).join(', ')
                        : <span style={{ color: 'var(--ink-mute)' }}>—</span>}
                    </td>
                    <td>£{p.price.toLocaleString('en-GB')}</td>
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

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={goPage} label="products" />
    </>
  );
}
