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
const EMPTY_STORE = { city: '', address: '', image: '', directionsUrl: '#', phone: '', isOpen: true };

export default function AdminSitePage() {
  const [tab, setTab]       = useState('hero');
  const [hero, setHero]     = useState(DEFAULT_HERO);
  const [stories, setStories] = useState([]);
  const [stores, setStores]   = useState([]);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState({});
  const [err, setErr]   = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.settings.get().then((s) => {
      if (s.hero)            setHero({ ...DEFAULT_HERO, ...s.hero });
      if (s.stories?.length) setStories(s.stories);
      if (s.stores?.length)  setStores(s.stores);
    }).catch(() => {});
  }, []);

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

  /* ── store helpers ─────────────────────────────────────────── */
  const storeChange = (i, field, val) =>
    setStores((arr) => arr.map((s, j) => j === i ? { ...s, [field]: val } : s));

  const storeUpload = async (e, i) => {
    const url = await doUpload(`store_${i}`, e.target.files);
    if (url) storeChange(i, 'image', url);
    e.target.value = '';
  };

  /* ── save ──────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setErr('');
    setSaved(false);
    try {
      await api.settings.update({ hero, stories, stores });
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
        <button style={tabBtn('stores')}  onClick={() => setTab('stores')}>Stores ({stores.length})</button>
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

      {/* ── STORES ───────────────────────────────────────────── */}
      {tab === 'stores' && (
        <div>
          {stores.map((s, i) => (
            <div key={i} className="admin-card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                  Store {i + 1}{s.city ? ` — ${s.city}` : ''}
                </span>
                <button
                  onClick={() => setStores((arr) => arr.filter((_, j) => j !== i))}
                  style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#991b1b', letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>

              <div className="form-row" style={{ alignItems: 'flex-start' }}>
                {/* Image */}
                <div className="field" style={{ maxWidth: 220 }}>
                  <label>Store image</label>
                  {s.image && (
                    <img src={resolveImage(s.image)} alt="" style={{ width: '100%', borderRadius: 4, marginBottom: 8, display: 'block' }} />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => storeUpload(e, i)} disabled={uploading[`store_${i}`]} />
                  {uploading[`store_${i}`] && <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Uploading…</span>}
                </div>

                <div style={{ flex: 1 }}>
                  <div className="form-row">
                    <div className="field">
                      <label>City</label>
                      <input value={s.city} onChange={(e) => storeChange(i, 'city', e.target.value)} placeholder="Delhi" />
                    </div>
                    <div className="field" style={{ paddingTop: 24 }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)', marginBottom: 0 }}>
                        <input type="checkbox" checked={s.isOpen} onChange={(e) => storeChange(i, 'isOpen', e.target.checked)} />
                        Open now
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label>Address</label>
                    <input value={s.address} onChange={(e) => storeChange(i, 'address', e.target.value)} placeholder="Greater Kailash II, New Delhi, 110048" />
                  </div>

                  <div className="form-row">
                    <div className="field">
                      <label>Phone</label>
                      <input value={s.phone} onChange={(e) => storeChange(i, 'phone', e.target.value)} placeholder="+910000000000" />
                    </div>
                    <div className="field">
                      <label>Directions URL</label>
                      <input value={s.directionsUrl} onChange={(e) => storeChange(i, 'directionsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" onClick={() => setStores((s) => [...s, { ...EMPTY_STORE }])}>
            + Add store
          </button>
        </div>
      )}
    </>
  );
}
