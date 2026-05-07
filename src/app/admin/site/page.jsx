'use client';

import { useState, useEffect } from 'react';
import { api, resolveImage } from '@/lib/api';

const DEFAULT_HERO = {
  desktop: 'https://picsum.photos/seed/herodesk/1920/1080',
  mobile:  'https://picsum.photos/seed/heromob/900/1200',
  eyebrow: 'SS26 — Drop 01',
  title:   'Built For The Street',
  ctaLabel:'Shop the collection',
  ctaHref: '/collections',
};

const EMPTY_STORY = { label: '', image: '', href: '/collections' };
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

export default function AdminSitePage() {
  const [tab, setTab]       = useState('hero');
  const [hero, setHero]     = useState(DEFAULT_HERO);
  const [stories, setStories] = useState([]);
  const [craft, setCraft]           = useState({ image: '', products: [] });
  const [shippingInfo, setShippingInfo] = useState(['']);
  const [allProducts, setAllProducts] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState({});
  const [err, setErr]   = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get().then((s) => {
      if (s.hero)                  setHero({ ...DEFAULT_HERO, ...s.hero });
      if (s.stories?.length)       setStories(s.stories);
      if (s.craft)                 setCraft({ image: s.craft.image || '', products: s.craft.products || [] });
      if (s.shippingInfo?.length)  setShippingInfo(s.shippingInfo);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== 'craft' || allProducts.length > 0) return;
    fetch(`${API_URL}/products?limit=200&status=active`)
      .then((r) => r.json())
      .then((d) => setAllProducts(d.items || []))
      .catch(() => {});
  }, [tab]);

  /* ── upload helper ─────────────────────────────────────────── */
  const doUpload = async (key, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return null;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const { urls } = await api.admin.upload([files[0]]);
      return urls[0];
    } catch (e) {
      setErr(e.message);
      return null;
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  /* ── hero uploads ──────────────────────────────────────────── */
  const heroUpload = async (e, field) => {
    const url = await doUpload(`hero_${field}`, e.target.files);
    if (url) setHero((h) => ({ ...h, [field]: url }));
    e.target.value = '';
  };

  /* ── story helpers ─────────────────────────────────────────── */
  const storyChange = (i, field, val) =>
    setStories((arr) => arr.map((s, j) => j === i ? { ...s, [field]: val } : s));

  const storyUpload = async (e, i) => {
    const url = await doUpload(`story_${i}`, e.target.files);
    if (url) storyChange(i, 'image', url);
    e.target.value = '';
  };

  /* ── save ──────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setErr('');
    setSaved(false);
    try {
      await api.settings.update({ hero, stories, craft, shippingInfo: shippingInfo.filter(Boolean) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── tab button style ──────────────────────────────────────── */
  const tabBtn = (t) => ({
    padding: '8px 18px',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: '1px solid var(--line)',
    borderRadius: 4,
    cursor: 'pointer',
    background: tab === t ? 'var(--ink)' : 'transparent',
    color: tab === t ? 'var(--paper)' : 'var(--ink)',
  });

  return (
    <>
      <div className="admin-head">
        <h1>Site Settings</h1>
        <button className="btn btn-dark btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {err   && <div className="err" style={{ marginBottom: 16 }}>{err}</div>}
      {saved && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534' }}>
          Saved successfully.
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={tabBtn('hero')}    onClick={() => setTab('hero')}>Hero Banner</button>
        <button style={tabBtn('stories')} onClick={() => setTab('stories')}>Stories ({stories.length})</button>
        <button style={tabBtn('craft')}   onClick={() => setTab('craft')}>Craft</button>
        <button style={tabBtn('content')} onClick={() => setTab('content')}>Content</button>
      </div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      {tab === 'hero' && (
        <div className="admin-card">
          <div className="form-row">
            {/* Desktop image */}
            <div className="field">
              <label>Desktop image</label>
              {hero.desktop && (
                <img src={resolveImage(hero.desktop)} alt="" style={{ width: '100%', maxWidth: 320, borderRadius: 4, marginBottom: 8, display: 'block' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => heroUpload(e, 'desktop')} disabled={uploading['hero_desktop']} />
              {uploading['hero_desktop'] && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Uploading…</span>}
            </div>
            {/* Mobile image */}
            <div className="field">
              <label>Mobile image</label>
              {hero.mobile && (
                <img src={resolveImage(hero.mobile)} alt="" style={{ width: '100%', maxWidth: 180, borderRadius: 4, marginBottom: 8, display: 'block' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => heroUpload(e, 'mobile')} disabled={uploading['hero_mobile']} />
              {uploading['hero_mobile'] && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Uploading…</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Eyebrow text</label>
              <input value={hero.eyebrow} onChange={(e) => setHero((h) => ({ ...h, eyebrow: e.target.value }))} placeholder="SS26 — Drop 01" />
            </div>
            <div className="field">
              <label>Headline</label>
              <input value={hero.title} onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))} placeholder="Built For The Street" />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Button label</label>
              <input value={hero.ctaLabel} onChange={(e) => setHero((h) => ({ ...h, ctaLabel: e.target.value }))} placeholder="Shop the collection" />
            </div>
            <div className="field">
              <label>Button link</label>
              <input value={hero.ctaHref} onChange={(e) => setHero((h) => ({ ...h, ctaHref: e.target.value }))} placeholder="/collections" />
            </div>
          </div>
        </div>
      )}

      {/* ── STORIES ──────────────────────────────────────────── */}
      {tab === 'stories' && (
        <div>
          {stories.map((s, i) => (
            <div key={i} className="admin-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  Story {i + 1}
                </span>
                <button
                  onClick={() => setStories((arr) => arr.filter((_, j) => j !== i))}
                  style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#991b1b', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', gap: 16, alignItems: 'start' }}>
                {/* Circle image */}
                <div>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#f3f4f6', marginBottom: 8 }}>
                    {s.image && (
                      <img src={resolveImage(s.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <label style={{ display: 'block', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'underline' }}>
                    {uploading[`story_${i}`] ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => storyUpload(e, i)} disabled={uploading[`story_${i}`]} />
                  </label>
                </div>

                <div className="field">
                  <label>Label</label>
                  <input value={s.label} onChange={(e) => storyChange(i, 'label', e.target.value)} placeholder="new caps" />
                </div>
                <div className="field">
                  <label>Link</label>
                  <input value={s.href} onChange={(e) => storyChange(i, 'href', e.target.value)} placeholder="/collections" />
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={() => setStories((s) => [...s, { ...EMPTY_STORY }])}>
            + Add story
          </button>
        </div>
      )}

      {/* ── CONTENT ─────────────────────────────────────────── */}
      {tab === 'content' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* Product page shipping info */}
          <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>
              Product page — shipping &amp; info lines
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>
              Each line appears as a ✓ bullet on every product detail page.
            </p>
            {shippingInfo.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-soft)', paddingTop: 10 }}>✓</span>
                <input
                  value={line}
                  onChange={(e) => setShippingInfo((a) => a.map((v, j) => j === i ? e.target.value : v))}
                  placeholder="Shipping info line…"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => setShippingInfo((a) => a.filter((_, j) => j !== i))}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, padding: '0 10px', background: 'none', cursor: 'pointer' }}
                >✕</button>
              </div>
            ))}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShippingInfo((a) => [...a, ''])}
              style={{ marginTop: 4 }}
            >+ Add line</button>
          </div>
        </div>
      )}

      {/* ── CRAFT ───────────────────────────────────────────── */}
      {tab === 'craft' && (
        <div>
          {/* Card image */}
          <div className="admin-card" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Card image</label>
              {craft.image && (
                <img src={resolveImage(craft.image)} alt="" style={{ width: '100%', maxWidth: 320, borderRadius: 4, marginBottom: 8, display: 'block' }} />
              )}
              <input
                type="file" accept="image/*"
                onChange={async (e) => {
                  const url = await doUpload('craft_image', e.target.files);
                  if (url) setCraft((c) => ({ ...c, image: url }));
                  e.target.value = '';
                }}
                disabled={uploading['craft_image']}
              />
              {uploading['craft_image'] && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Uploading…</span>}
            </div>
          </div>

          {/* Product picker */}
          <div className="admin-card">
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 4 }}>
                Crafted Products
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Select products to display when the Craft card is clicked. ({craft.products.length} selected)
              </p>
            </div>

            {allProducts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>Loading products…</p>
            ) : (
              <div style={{ maxHeight: 480, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 4 }}>
                {allProducts.map((p) => {
                  const selected = craft.products.some((cp) => cp._id === p._id);
                  const toggle = () => {
                    setCraft((c) => ({
                      ...c,
                      products: selected
                        ? c.products.filter((cp) => cp._id !== p._id)
                        : [...c.products, { _id: p._id, title: p.title, price: p.price, compareAtPrice: p.compareAtPrice, images: p.images, slug: p.slug, isNew: p.isNew }],
                    }));
                  };
                  return (
                    <label
                      key={p._id}
                      onClick={toggle}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderBottom: '1px solid var(--line)',
                        cursor: 'pointer', background: selected ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <input type="checkbox" checked={selected} onChange={toggle} style={{ flexShrink: 0 }} />
                      {p.images?.[0] && (
                        <img src={resolveImage(p.images[0])} alt="" style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>£{p.price}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
