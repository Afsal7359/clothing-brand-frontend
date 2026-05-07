'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, resolveImage } from '@/lib/api';

const API_URL_CLIENT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const MAX_FILE_MB = 2;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

async function compressImage(file, maxW = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = Math.min(img.width, maxW);
      const h = Math.round(img.height * (w / img.width));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', 0.80
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadOne(file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : '';
  const fd = new FormData();
  fd.append('files', file);
  const res = await fetch(`${API_URL_CLIENT}/admin/upload`, {
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
  price: '',
  compareAtPrice: '',
  category: 'tshirts',
  status: 'active',
  isFeatured: false,
  isNew: true,
  images: [],
  colors: [],
  tags: [],
  variants: [
    { size: 'S', stock: 0 },
    { size: 'M', stock: 0 },
    { size: 'L', stock: 0 },
    { size: 'XL', stock: 0 },
  ],
  collections: [],
  relatedProducts: [],
};

const CATEGORIES = ['tshirts', 'hoodies', 'jackets', 'shirts', 'sweatshirts', 'polos', 'pants', 'shorts', 'caps', 'bags', 'other'];

export default function ProductForm({ initial = null, onSaved }) {
  const router = useRouter();
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.collections.list({ active: 'false' }).then((r) => setCollections(r.items || []));
    api.products.list({ limit: 200, status: 'active' }).then((r) => setAllProducts(r.items || []));
  }, []);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    setErr('');

    const oversized = files.filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length > 0) {
      setErr(`File too large: ${oversized.map((f) => f.name).join(', ')} — max ${MAX_FILE_MB} MB per image.`);
      return;
    }

    setUploading(true);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      const urls = await Promise.all(compressed.map(uploadOne));
      setField('images', [...form.images, ...urls.filter(Boolean)]);
    } catch (error) {
      setErr(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setField('images', form.images.filter((_, i) => i !== idx));
  };

  const updateVariant = (i, key, value) => {
    const next = [...form.variants];
    next[i] = { ...next[i], [key]: value };
    setField('variants', next);
  };

  const addVariant = () => setField('variants', [...form.variants, { size: '', stock: 0 }]);
  const removeVariant = (i) => setField('variants', form.variants.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        variants: form.variants.filter((v) => v.size).map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
        colors: Array.isArray(form.colors) ? form.colors : String(form.colors).split(',').map((s) => s.trim()).filter(Boolean),
        tags: Array.isArray(form.tags) ? form.tags : String(form.tags).split(',').map((s) => s.trim()).filter(Boolean),
        relatedProducts: (form.relatedProducts || []).map((x) => x._id || x),
      };
      let saved;
      if (initial?._id) {
        saved = await api.products.update(initial._id, payload);
      } else {
        saved = await api.products.create(payload);
      }
      if (onSaved) onSaved(saved);
      else router.push('/admin/products');
    } catch (error) {
      setErr(error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Basics</h3>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea rows={5} value={form.description} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Price (£)</label>
                <input type="number" min="0" step="any" value={form.price} onChange={(e) => setField('price', e.target.value)} required />
              </div>
              <div className="field">
                <label>Compare at (strike-through)</label>
                <input type="number" min="0" step="any" value={form.compareAtPrice || ''} onChange={(e) => setField('compareAtPrice', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Images</h3>
            <label className="uploader">
              <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} />
              <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                {uploading ? 'Compressing & uploading…' : 'Click to select images (first = main, second = hover)'}
              </div>
            </label>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)', marginTop: 6 }}>
              Max {MAX_FILE_MB} MB per image — files are auto-compressed before upload
            </p>
            {form.images.length > 0 && (
              <div className="image-grid">
                {form.images.map((src, i) => (
                  <div key={i} className="img-wrap">
                    <img src={resolveImage(src)} alt="" />
                    <button type="button" className="img-rm" onClick={() => removeImage(i)} aria-label="Remove">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Variants &amp; stock</h3>
            {form.variants.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
                <input placeholder="Size (S, M, One Size…)" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4 }} />
                <input type="number" min="0" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} style={{ padding: 10, border: '1px solid var(--line)', borderRadius: 4 }} />
                <button type="button" className="btn-sm" onClick={() => removeVariant(i)} style={{ color: '#991b1b', border: '1px solid var(--line)', borderRadius: 4, padding: '0 12px' }}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addVariant}>+ Add variant</button>
          </div>

          <div className="admin-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Metadata</h3>
            <div className="field">
              <label>Colors (comma separated)</label>
              <input
                value={Array.isArray(form.colors) ? form.colors.join(', ') : form.colors}
                onChange={(e) => setField('colors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="Black, White"
              />
            </div>
            <div className="field">
              <label>Tags (comma separated)</label>
              <input
                value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags}
                onChange={(e) => setField('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="oversized, drop1"
              />
            </div>
          </div>
        </div>

        <aside style={{ position: 'sticky', top: 20 }}>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Status</h3>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
              <span style={{ fontSize: 13 }}>Featured on homepage</span>
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={form.isNew} onChange={(e) => setField('isNew', e.target.checked)} />
              <span style={{ fontSize: 13 }}>Show &quot;New&quot; tag</span>
            </label>
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Collections</h3>
            {collections.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>No collections yet.</p>
            ) : (
              collections.map((c) => (
                <label key={c._id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.collections?.includes(c._id) || form.collections?.some((x) => x._id === c._id)}
                    onChange={(e) => {
                      const current = (form.collections || []).map((x) => x._id || x);
                      if (e.target.checked) setField('collections', [...current, c._id]);
                      else setField('collections', current.filter((id) => id !== c._id));
                    }}
                  />
                  <span>{c.title}</span>
                </label>
              ))
            )}
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 14 }}>Related products</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>If none selected, same-category products are shown automatically.</p>
            <input
              placeholder="Search products…"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13, marginBottom: 10 }}
            />
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 4 }}>
              {allProducts
                .filter((p) => p._id !== initial?._id && (!productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase())))
                .slice(0, 30)
                .map((p) => {
                  const currentIds = (form.relatedProducts || []).map((x) => x._id || x);
                  const checked = currentIds.includes(p._id);
                  return (
                    <label key={p._id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid var(--line)', fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) setField('relatedProducts', [...currentIds, p._id]);
                          else setField('relatedProducts', currentIds.filter((id) => id !== p._id));
                        }}
                      />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>£{p.price}</span>
                    </label>
                  );
                })}
            </div>
            {(form.relatedProducts?.length > 0) && (
              <p style={{ fontSize: 11, marginTop: 6, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>
                {form.relatedProducts.length} selected
              </p>
            )}
          </div>

          {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}

          <button type="submit" className="btn btn-dark" disabled={saving} style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
            {saving ? 'Saving…' : initial ? 'Update product' : 'Create product'}
          </button>
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          form > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          aside { position: static !important; }
        }
      `}</style>
    </form>
  );
}
