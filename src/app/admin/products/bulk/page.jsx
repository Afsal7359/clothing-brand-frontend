'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { resolveImage } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

const TEMPLATE_HEADERS = [
  'title', 'description', 'price', 'compareAtPrice',
  'sizes', 'colors', 'tags', 'collections',
  'isFeatured', 'isNew', 'status',
];

const SAMPLE_ROW = [
  'Classic Oversized Tee',
  'Premium cotton blend oversized t-shirt with dropped shoulders.',
  1299,
  1799,
  'S:10,M:20,L:15,XL:5,XXL:2',
  'Black,White,Navy Blue',
  'cotton,oversized,essentials',
  'summer-essentials',
  'FALSE',
  'TRUE',
  'draft',
];

const COLUMN_HINTS = [
  'Product name (required)',
  'Full description',
  'Selling price in £ (required)',
  'Original/MRP price in £',
  'Format: S:10,M:20,L:15,XL:5 (size:stock)',
  'Comma-separated colors',
  'Comma-separated tags',
  'Collection slug(s), comma-separated',
  'TRUE or FALSE',
  'TRUE or FALSE',
  'active or draft',
];

/* ── image helpers ─────────────────────────────────────────── */
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
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg', 0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadImage(file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : '';
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

/* ── Excel helpers ─────────────────────────────────────────── */
function downloadTemplate(collections = []) {
  const wb = XLSX.utils.book_new();

  // Main products sheet
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    SAMPLE_ROW,
  ]);
  ws['!cols'] = [
    { wch: 30 }, { wch: 50 }, { wch: 10 }, { wch: 14 },
    { wch: 28 }, { wch: 24 }, { wch: 28 }, { wch: 30 },
    { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // Hints sheet
  const hintsData = TEMPLATE_HEADERS.map((h, i) => [h, COLUMN_HINTS[i]]);
  const wsHints = XLSX.utils.aoa_to_sheet([['Column', 'Instructions'], ...hintsData]);
  wsHints['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsHints, 'Instructions');

  // Collections reference sheet
  if (collections.length > 0) {
    const colData = collections.map((c) => [c.slug, c.title]);
    const wsCol = XLSX.utils.aoa_to_sheet([['slug (use in "collections" column)', 'title'], ...colData]);
    wsCol['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsCol, 'Available Collections');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'underdwag-bulk-template.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

function parseSizes(raw = '') {
  if (!raw) return [{ size: 'S', stock: 0 }, { size: 'M', stock: 0 }, { size: 'L', stock: 0 }, { size: 'XL', stock: 0 }];
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean).map((entry) => {
    const [size, stock] = entry.split(':');
    return { size: size.trim().toUpperCase(), stock: Number(stock) || 0 };
  });
}

function parseBool(val) {
  const v = String(val || '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseCSV(val) {
  if (!val) return [];
  return String(val).split(',').map((s) => s.trim()).filter(Boolean);
}

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) { resolve([]); return; }

        const headers = rows[0].map((h) => String(h).trim().toLowerCase());
        const idx = (name) => headers.indexOf(name);

        const products = rows.slice(1).filter((row) => row.some((c) => c !== '')).map((row, i) => {
          const get = (name) => row[idx(name)] ?? '';
          return {
            id: `row_${i}_${Math.random().toString(36).slice(2)}`,
            title: String(get('title') || '').trim(),
            description: String(get('description') || '').trim(),
            price: String(get('price') || ''),
            compareAtPrice: String(get('compareatprice') || get('compareAtPrice') || ''),
            sizes: parseSizes(get('sizes')),
            colors: parseCSV(get('colors')),
            tags: parseCSV(get('tags')),
            collectionSlugs: parseCSV(get('collections')),
            isFeatured: parseBool(get('isfeatured') || get('isFeatured')),
            isNew: parseBool(get('isnew') !== '' ? get('isnew') : (get('isNew') !== '' ? get('isNew') : 'true')),
            status: String(get('status') || 'draft').trim().toLowerCase(),
            images: [],
            imageUrls: [],
            relatedProductIds: [],
            uploadingImages: false,
            done: false,
            error: '',
          };
        });
        resolve(products);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/* ── Related products picker ───────────────────────────────── */
function RelatedPicker({ selectedIds, onChange, excludeId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const search = useCallback((q) => {
    clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/products?q=${encodeURIComponent(q)}&limit=10&status=active`);
        const data = await res.json();
        setResults((data.items || []).filter((p) => p._id !== excludeId));
      } catch {}
    }, 300);
  }, [excludeId]);

  const toggle = (product) => {
    const ids = selectedIds.includes(product._id)
      ? selectedIds.filter((id) => id !== product._id)
      : [...selectedIds, product._id];
    onChange(ids);
  };

  return (
    <div className="bulk-related-picker" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: selectedIds.length ? 6 : 0 }}>
        {selectedIds.map((id) => (
          <span key={id} className="bulk-tag" onClick={() => onChange(selectedIds.filter((x) => x !== id))}>
            {id.slice(-6)} ✕
          </span>
        ))}
      </div>
      <input
        className="bulk-picker-input"
        placeholder="Search products to relate…"
        value={query}
        onChange={(e) => { setQuery(e.target.value); search(e.target.value); setOpen(true); }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div className="bulk-picker-dropdown">
          {results.map((p) => (
            <div key={p._id} className={`bulk-picker-item${selectedIds.includes(p._id) ? ' selected' : ''}`}
              onMouseDown={() => toggle(p)}>
              {p.images?.[0] && <img src={resolveImage(p.images[0])} alt="" />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>£{p.price}</div>
              </div>
              {selectedIds.includes(p._id) && <span style={{ marginLeft: 'auto', color: '#16a34a' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Collection multi-select ───────────────────────────────── */
function CollectionPicker({ selectedSlugs, collections, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bulk-related-picker" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: selectedSlugs.length ? 6 : 0 }}>
        {selectedSlugs.map((s) => (
          <span key={s} className="bulk-tag" onClick={() => onChange(selectedSlugs.filter((x) => x !== s))}>
            {s} ✕
          </span>
        ))}
      </div>
      <button type="button" className="bulk-picker-input" style={{ textAlign: 'left', cursor: 'pointer', width: '100%', background: 'var(--bg)', color: selectedSlugs.length ? 'var(--ink)' : 'var(--ink-soft)' }}
        onClick={() => setOpen((v) => !v)}>
        {selectedSlugs.length ? `${selectedSlugs.length} collection${selectedSlugs.length > 1 ? 's' : ''}` : 'Choose collections…'}
      </button>
      {open && (
        <div className="bulk-picker-dropdown" style={{ zIndex: 20 }}>
          {collections.map((c) => (
            <div key={c._id} className={`bulk-picker-item${selectedSlugs.includes(c.slug) ? ' selected' : ''}`}
              onClick={() => {
                const next = selectedSlugs.includes(c.slug)
                  ? selectedSlugs.filter((s) => s !== c.slug)
                  : [...selectedSlugs, c.slug];
                onChange(next);
              }}>
              {c.desktopImage || c.mobileImage
                ? <img src={resolveImage(c.desktopImage || c.mobileImage)} alt="" />
                : <div className="bulk-col-initial">{c.title[0]?.toUpperCase()}</div>}
              <div style={{ fontSize: 13 }}>{c.title}</div>
              {selectedSlugs.includes(c.slug) && <span style={{ marginLeft: 'auto', color: '#16a34a' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Image drop zone per product ───────────────────────────── */
function ProductImages({ images, onAdd, onRemove, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    onAdd(null, true);
    const urls = await Promise.all(imageFiles.map((f) => uploadImage(f).catch(() => '')));
    onAdd(urls.filter(Boolean), false);
  };

  return (
    <div className="bulk-img-zone">
      {/* Hidden file input mounted in DOM — required for reliable cross-browser click */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {images.map((url, i) => (
        <div key={i} className="bulk-img-thumb">
          <img src={resolveImage(url)} alt="" />
          <button type="button" className="bulk-img-remove" onClick={() => onRemove(i)}>✕</button>
          {i === 0 && <span className="bulk-img-primary">main</span>}
        </div>
      ))}
      <div
        className={`bulk-img-add${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => {
          if (uploading) return;
          fileInputRef.current?.click();
        }}
      >
        {uploading ? <span className="bulk-img-spinner">↑</span> : <span>+</span>}
      </div>
    </div>
  );
}

/* ── Sizes editor ──────────────────────────────────────────── */
function SizesEditor({ sizes, onChange }) {
  const update = (i, field, val) => {
    const next = sizes.map((s, idx) => idx === i ? { ...s, [field]: field === 'stock' ? Number(val) || 0 : val } : s);
    onChange(next);
  };
  const add = () => onChange([...sizes, { size: '', stock: 0 }]);
  const remove = (i) => onChange(sizes.filter((_, idx) => idx !== i));

  return (
    <div className="bulk-sizes">
      {sizes.map((s, i) => (
        <div key={i} className="bulk-size-row">
          <input className="bulk-size-input" placeholder="Size" value={s.size}
            onChange={(e) => update(i, 'size', e.target.value)} />
          <input className="bulk-size-stock" type="number" placeholder="Stock" value={s.stock}
            onChange={(e) => update(i, 'stock', e.target.value)} min="0" />
          <button type="button" className="bulk-size-del" onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <button type="button" className="bulk-size-add" onClick={add}>+ size</button>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function BulkUploadPage() {
  const [step, setStep] = useState('upload'); // 'upload' | 'review' | 'done'
  const [rows, setRows] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionSlugToId, setCollectionSlugToId] = useState({});
  const [saving, setSaving] = useState(false);
  const [doneResults, setDoneResults] = useState([]);
  const [xlsxDragOver, setXlsxDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/collections`)
      .then((r) => r.json())
      .then((d) => {
        const items = d.items || [];
        setCollections(items);
        const map = {};
        items.forEach((c) => { map[c.slug] = c._id; });
        setCollectionSlugToId(map);
      })
      .catch(() => {});
  }, []);

  const handleExcelFile = async (file) => {
    if (!file) return;
    setParseError('');
    setParsing(true);
    try {
      const products = await parseExcelFile(file);
      if (products.length === 0) { setParseError('No product rows found. Make sure you fill in the Products sheet.'); setParsing(false); return; }
      setRows(products);
      setStep('review');
    } catch {
      setParseError('Could not parse the file. Make sure it\'s a valid .xlsx file from the template.');
    }
    setParsing(false);
  };

  const updateRow = (id, updates) =>
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const handleAddImages = (id, urls, isUploading) => {
    if (isUploading) { updateRow(id, { uploadingImages: true }); return; }
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, imageUrls: [...(r.imageUrls || []), ...urls], uploadingImages: false } : r));
  };

  const handleRemoveImage = (id, idx) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = [...r.imageUrls];
      next.splice(idx, 1);
      return { ...r, imageUrls: next };
    }));
  };

  const handleSaveAll = async () => {
    const ready = rows.filter((r) => r.title && r.price && !r.done);
    if (!ready.length) return;
    setSaving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : '';
    const results = [];

    // Sequential saves to avoid duplicate-slug race conditions when titles are similar
    for (const r of ready) {
      try {
        const collectionIds = (r.collectionSlugs || [])
          .map((s) => collectionSlugToId[s]).filter(Boolean);

        const payload = {
          title: r.title.trim(),
          description: r.description || '',
          price: Number(r.price) || 0,
          ...(r.compareAtPrice ? { compareAtPrice: Number(r.compareAtPrice) } : {}),
          images: r.imageUrls || [],
          // Strip empty-size entries so Mongoose required validation doesn't fail
          variants: (r.sizes || []).filter((v) => v.size && v.size.trim()),
          colors: r.colors || [],
          tags: r.tags || [],
          collections: collectionIds,
          relatedProducts: r.relatedProductIds || [],
          isFeatured: r.isFeatured || false,
          isNew: r.isNew !== false,
          status: r.status || 'draft',
        };

        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Save failed');
        results.push({ id: r.id, product: data, title: r.title });
        updateRow(r.id, { done: true, error: '' });
      } catch (e) {
        const msg = e.message || 'Failed to save';
        updateRow(r.id, { error: msg });
        results.push({ id: r.id, title: r.title, failed: true, error: msg });
      }
    }

    setDoneResults(results);
    setSaving(false);
    // Always go to done step so user can see what succeeded/failed
    setStep('done');
  };

  const readyCount = rows.filter((r) => r.title && r.price && !r.done).length;

  /* ── Upload step ── */
  if (step === 'upload') {
    return (
      <>
        <div className="admin-head">
          <div>
            <h1>Bulk Upload</h1>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
              Download the Excel template → fill product details → upload → add images → publish
            </p>
          </div>
          <Link href="/admin/products" className="btn">← Products</Link>
        </div>

        {/* Step 1 — Download template */}
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Step 1 — Download Template
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', maxWidth: 440, lineHeight: 1.6 }}>
                The template includes 3 sheets: <strong>Products</strong> (fill this), <strong>Instructions</strong> (column guide), and <strong>Available Collections</strong> (your collection slugs for reference).
              </p>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>
                Columns: title · description · price · compareAtPrice · sizes · colors · tags · collections · isFeatured · isNew · status
              </div>
            </div>
            <button className="btn btn-dark" onClick={() => downloadTemplate(collections)}>
              ↓ Download Template (.xlsx)
            </button>
          </div>
        </div>

        {/* Step 2 — Upload filled Excel */}
        <div className="admin-card">
          <div style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            Step 2 — Upload Filled Excel
          </div>
          <div
            className={`bulk-dropzone${xlsxDragOver ? ' drag-over' : ''}`}
            style={{ borderStyle: 'dashed' }}
            onDragOver={(e) => { e.preventDefault(); setXlsxDragOver(true); }}
            onDragLeave={() => setXlsxDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setXlsxDragOver(false); handleExcelFile(e.dataTransfer.files[0]); }}
            onClick={() => !parsing && document.getElementById('xlsx-input').click()}
          >
            <input id="xlsx-input" type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
              onChange={(e) => handleExcelFile(e.target.files[0])} />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32" style={{ color: 'var(--ink-soft)', marginBottom: 10 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
              {parsing ? 'Parsing…' : xlsxDragOver ? 'Drop Excel file here' : 'Drag your filled .xlsx here or click to select'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>Only .xlsx files · Max 500 products per upload</div>
          </div>
          {parseError && <div className="err" style={{ marginTop: 12 }}>{parseError}</div>}
        </div>
      </>
    );
  }

  /* ── Done step ── */
  if (step === 'done') {
    const saved = doneResults.filter((r) => !r.failed);
    const failed = doneResults.filter((r) => r.failed);
    return (
      <>
        <div className="admin-head">
          <h1>Upload Complete</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={() => { setRows([]); setDoneResults([]); setStep('upload'); }}>Upload another batch</button>
            <Link href="/admin/products" className="btn btn-dark">View all products</Link>
          </div>
        </div>
        <div className="admin-card">
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontFamily: 'var(--display)', color: '#16a34a' }}>{saved.length}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Created</div>
            </div>
            {failed.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontFamily: 'var(--display)', color: '#dc2626' }}>{failed.length}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>Failed</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {saved.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#16a34a', fontSize: 14 }}>✓</span>
                <span style={{ flex: 1, fontSize: 14 }}>{r.title}</span>
                {r.product?.slug && (
                  <Link href={`/admin/products/${r.product._id}/edit`} className="btn btn-sm btn-outline">Edit</Link>
                )}
              </div>
            ))}
            {failed.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: '#dc2626', fontSize: 14, marginTop: 1 }}>✕</span>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--ink)' }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>{r.error || 'Failed to save'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  /* ── Review step ── */
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Review Products</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>
            {rows.length} product{rows.length !== 1 ? 's' : ''} from Excel · Add images · Confirm collections · Save
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => setStep('upload')}>← Back</button>
          <button
            className="btn btn-dark"
            onClick={handleSaveAll}
            disabled={saving || readyCount === 0}
          >
            {saving ? 'Saving…' : `Create ${readyCount} product${readyCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <div className="bulk-review-list">
        {rows.map((r, idx) => (
          <div key={r.id} className={`bulk-review-card${r.done ? ' done' : r.error ? ' has-error' : ''}`}>
            {/* Card header */}
            <div className="bulk-review-card-head">
              <span className="bulk-review-num">{idx + 1}</span>
              <input
                className="bulk-review-title-input"
                value={r.title}
                onChange={(e) => updateRow(r.id, { title: e.target.value })}
                placeholder="Product title *"
                disabled={r.done}
              />
              {r.done
                ? <span style={{ color: '#16a34a', fontFamily: 'var(--mono)', fontSize: 12 }}>✓ Saved</span>
                : r.error
                  ? <span style={{ color: '#dc2626', fontSize: 12 }}>{r.error}</span>
                  : null}
              {!r.done && (
                <button type="button" className="bulk-review-del" onClick={() => removeRow(r.id)}>✕</button>
              )}
            </div>

            <div className="bulk-review-body">
              {/* Left: Images */}
              <div className="bulk-review-images">
                <div className="bulk-section-label">Images</div>
                <ProductImages
                  images={r.imageUrls || []}
                  onAdd={(urls, uploading) => handleAddImages(r.id, urls, uploading)}
                  onRemove={(i) => handleRemoveImage(r.id, i)}
                  uploading={r.uploadingImages}
                />
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>First image = main. Drag to reorder (edit later).</div>
              </div>

              {/* Middle: Details */}
              <div className="bulk-review-details">
                <div className="bulk-review-row">
                  <div className="bulk-review-field">
                    <label>Price £ *</label>
                    <input type="number" value={r.price} onChange={(e) => updateRow(r.id, { price: e.target.value })} min="0" disabled={r.done} />
                  </div>
                  <div className="bulk-review-field">
                    <label>Compare Price £</label>
                    <input type="number" value={r.compareAtPrice} onChange={(e) => updateRow(r.id, { compareAtPrice: e.target.value })} min="0" disabled={r.done} />
                  </div>
                  <div className="bulk-review-field">
                    <label>Status</label>
                    <select value={r.status} onChange={(e) => updateRow(r.id, { status: e.target.value })} disabled={r.done}>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                </div>

                <div className="bulk-review-field" style={{ marginTop: 8 }}>
                  <label>Description</label>
                  <textarea rows={2} value={r.description} onChange={(e) => updateRow(r.id, { description: e.target.value })} disabled={r.done} />
                </div>

                <div className="bulk-review-row" style={{ marginTop: 8 }}>
                  <div className="bulk-review-field">
                    <label>Colors (comma-separated)</label>
                    <input value={(r.colors || []).join(', ')}
                      onChange={(e) => updateRow(r.id, { colors: parseCSV(e.target.value) })}
                      placeholder="Black, White, Navy" disabled={r.done} />
                  </div>
                  <div className="bulk-review-field">
                    <label>Tags (comma-separated)</label>
                    <input value={(r.tags || []).join(', ')}
                      onChange={(e) => updateRow(r.id, { tags: parseCSV(e.target.value) })}
                      placeholder="cotton, oversized" disabled={r.done} />
                  </div>
                </div>

                <div className="bulk-review-row" style={{ marginTop: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={r.isFeatured} onChange={(e) => updateRow(r.id, { isFeatured: e.target.checked })} disabled={r.done} />
                    Featured
                  </label>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={r.isNew} onChange={(e) => updateRow(r.id, { isNew: e.target.checked })} disabled={r.done} />
                    New
                  </label>
                </div>
              </div>

              {/* Right: Sizes, Collections, Related */}
              <div className="bulk-review-right">
                <div className="bulk-section-label">Sizes & Stock</div>
                <SizesEditor sizes={r.sizes || []} onChange={(sizes) => updateRow(r.id, { sizes })} />

                <div className="bulk-section-label" style={{ marginTop: 14 }}>Collections</div>
                <CollectionPicker
                  selectedSlugs={r.collectionSlugs || []}
                  collections={collections}
                  onChange={(slugs) => updateRow(r.id, { collectionSlugs: slugs })}
                />

                <div className="bulk-section-label" style={{ marginTop: 14 }}>Related Products</div>
                <RelatedPicker
                  selectedIds={r.relatedProductIds || []}
                  onChange={(ids) => updateRow(r.id, { relatedProductIds: ids })}
                  excludeId={null}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {rows.length > 3 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-dark" onClick={handleSaveAll} disabled={saving || readyCount === 0}>
            {saving ? 'Saving…' : `Create ${readyCount} product${readyCount !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </>
  );
}
