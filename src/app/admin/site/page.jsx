'use client';

import { useState, useEffect } from 'react';
import { api, resolveImage } from '@/lib/api';
import { compressImage } from '@/lib/imageUtils';

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

const DEFAULT_PAGES = {
  contact:  { email: 'support@northverse.com', whatsappHref: '', hours: 'Mon–Sat, 10am–6pm GMT' },
  faq:      { supportHours: 'Mon–Sat · 10am–6pm GMT · Reply within 24 hours' },
  shipping: { standardPrice: '£3.99', standardTime: '3–5 working days', expressPrice: '£6.99', expressTime: '1–2 working days', freeThreshold: '£250', cutoffTime: '2pm GMT' },
  returns:  { email: 'support@northverse.com', windowDays: '7', refundDays: '5–7' },
};

const DEFAULT_FOOTER = {
  description:   'Premium streetwear. New drops every season.',
  instagramUrl:  '',
  whatsappUrl:   '',
  copyrightText: '',
  supportLinks: [
    { label: 'Track Order',         href: '/track-order' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Shipping',            href: '/shipping' },
    { label: 'FAQ',                 href: '/faq' },
    { label: 'Contact',             href: '/contact' },
  ],
};

export default function AdminSitePage() {

  const [tab, setTab]       = useState('hero');
  const [hero, setHero]     = useState(DEFAULT_HERO);
  const [stories, setStories] = useState([]);
  const [craft, setCraft]           = useState({ image: '', products: [] });
  const [shippingInfo, setShippingInfo] = useState(['']);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [pages, setPages]   = useState(DEFAULT_PAGES);
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
      if (s.footer)                setFooter({ ...DEFAULT_FOOTER, ...s.footer, supportLinks: s.footer.supportLinks?.length ? s.footer.supportLinks : DEFAULT_FOOTER.supportLinks });
      if (s.pages)                 setPages({ ...DEFAULT_PAGES, contact: { ...DEFAULT_PAGES.contact, ...s.pages?.contact }, faq: { ...DEFAULT_PAGES.faq, ...s.pages?.faq }, shipping: { ...DEFAULT_PAGES.shipping, ...s.pages?.shipping }, returns: { ...DEFAULT_PAGES.returns, ...s.pages?.returns } });
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
    setUploading((u) => ({ ...u, [key]: 0 }));
    try {
      const compressed = await compressImage(files[0]);
      const { urls } = await api.admin.uploadWithProgress([compressed], (pct) =>
        setUploading((u) => ({ ...u, [key]: pct }))
      );
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
      await api.settings.update({ hero, stories, craft, shippingInfo: shippingInfo.filter(Boolean), footer, pages });
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
        <button style={tabBtn('footer')}  onClick={() => setTab('footer')}>Footer</button>
        <button style={tabBtn('pages')}   onClick={() => setTab('pages')}>Pages</button>
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
              {uploading['hero_desktop'] !== false && uploading['hero_desktop'] !== undefined && <><div className="upload-progress-wrap" style={{ marginTop: 6 }}><div className="upload-progress-bar" style={{ width: `${uploading['hero_desktop']}%` }} /></div><span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>{uploading['hero_desktop']}%</span></>}
            </div>
            {/* Mobile image */}
            <div className="field">
              <label>Mobile image</label>
              {hero.mobile && (
                <img src={resolveImage(hero.mobile)} alt="" style={{ width: '100%', maxWidth: 180, borderRadius: 4, marginBottom: 8, display: 'block' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => heroUpload(e, 'mobile')} disabled={uploading['hero_mobile']} />
              {uploading['hero_mobile'] !== false && uploading['hero_mobile'] !== undefined && <><div className="upload-progress-wrap" style={{ marginTop: 6 }}><div className="upload-progress-bar" style={{ width: `${uploading['hero_mobile']}%` }} /></div><span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>{uploading['hero_mobile']}%</span></>}
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
                    {uploading[`story_${i}`] !== false && uploading[`story_${i}`] !== undefined ? `${uploading[`story_${i}`]}%` : 'Upload image'}
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

      {/* ── FOOTER ──────────────────────────────────────────── */}
      {tab === 'footer' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>
              Brand description &amp; social links
            </div>
            <div className="field">
              <label>Brand description</label>
              <textarea
                rows={3}
                value={footer.description}
                onChange={(e) => setFooter((f) => ({ ...f, description: e.target.value }))}
                placeholder="Premium streetwear. New drops every season."
              />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Instagram URL</label>
                <input
                  value={footer.instagramUrl}
                  onChange={(e) => setFooter((f) => ({ ...f, instagramUrl: e.target.value }))}
                  placeholder="https://instagram.com/underdwag"
                />
              </div>
              <div className="field">
                <label>WhatsApp URL</label>
                <input
                  value={footer.whatsappUrl}
                  onChange={(e) => setFooter((f) => ({ ...f, whatsappUrl: e.target.value }))}
                  placeholder="https://wa.me/447XXXXXXXXX"
                />
              </div>
            </div>
            <div className="field">
              <label>Copyright text (leave blank for auto)</label>
              <input
                value={footer.copyrightText}
                onChange={(e) => setFooter((f) => ({ ...f, copyrightText: e.target.value }))}
                placeholder={`© ${new Date().getFullYear()} underdwag. All rights reserved.`}
              />
            </div>
          </div>

          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>
              Support links
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 16 }}>
              These appear in the Support column of the footer.
            </p>
            {footer.supportLinks.map((link, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={link.label}
                  onChange={(e) => setFooter((f) => ({ ...f, supportLinks: f.supportLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l) }))}
                  placeholder="Label"
                  style={{ flex: 1 }}
                />
                <input
                  value={link.href}
                  onChange={(e) => setFooter((f) => ({ ...f, supportLinks: f.supportLinks.map((l, j) => j === i ? { ...l, href: e.target.value } : l) }))}
                  placeholder="/page-slug"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => setFooter((f) => ({ ...f, supportLinks: f.supportLinks.filter((_, j) => j !== i) }))}
                  style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#991b1b', border: '1px solid #fecaca', borderRadius: 4, padding: '0 10px', background: 'none', cursor: 'pointer' }}
                >✕</button>
              </div>
            ))}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setFooter((f) => ({ ...f, supportLinks: [...f.supportLinks, { label: '', href: '/' }] }))}
              style={{ marginTop: 4 }}
            >+ Add link</button>
          </div>
        </div>
      )}

      {/* ── PAGES ───────────────────────────────────────────── */}
      {tab === 'pages' && (
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Contact page */}
          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>Contact page</div>
            <div className="form-row">
              <div className="field">
                <label>Support email</label>
                <input value={pages.contact.email} onChange={(e) => setPages((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))} placeholder="support@example.com" />
              </div>
              <div className="field">
                <label>WhatsApp link</label>
                <input value={pages.contact.whatsappHref} onChange={(e) => setPages((p) => ({ ...p, contact: { ...p.contact, whatsappHref: e.target.value } }))} placeholder="https://wa.me/447..." />
              </div>
            </div>
            <div className="field">
              <label>Support hours</label>
              <input value={pages.contact.hours} onChange={(e) => setPages((p) => ({ ...p, contact: { ...p.contact, hours: e.target.value } }))} placeholder="Mon–Sat, 10am–6pm GMT" />
            </div>
          </div>

          {/* Shipping page */}
          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>Shipping page</div>
            <div className="form-row">
              <div className="field">
                <label>Standard price</label>
                <input value={pages.shipping.standardPrice} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, standardPrice: e.target.value } }))} placeholder="£3.99" />
              </div>
              <div className="field">
                <label>Standard delivery time</label>
                <input value={pages.shipping.standardTime} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, standardTime: e.target.value } }))} placeholder="3–5 working days" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Express price</label>
                <input value={pages.shipping.expressPrice} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, expressPrice: e.target.value } }))} placeholder="£6.99" />
              </div>
              <div className="field">
                <label>Express delivery time</label>
                <input value={pages.shipping.expressTime} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, expressTime: e.target.value } }))} placeholder="1–2 working days" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Free shipping threshold</label>
                <input value={pages.shipping.freeThreshold} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, freeThreshold: e.target.value } }))} placeholder="£250" />
              </div>
              <div className="field">
                <label>Same-day dispatch cutoff</label>
                <input value={pages.shipping.cutoffTime} onChange={(e) => setPages((p) => ({ ...p, shipping: { ...p.shipping, cutoffTime: e.target.value } }))} placeholder="2pm GMT" />
              </div>
            </div>
          </div>

          {/* Returns page */}
          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>Returns page</div>
            <div className="form-row">
              <div className="field">
                <label>Returns email</label>
                <input value={pages.returns.email} onChange={(e) => setPages((p) => ({ ...p, returns: { ...p.returns, email: e.target.value } }))} placeholder="support@example.com" />
              </div>
              <div className="field">
                <label>Return window (days)</label>
                <input value={pages.returns.windowDays} onChange={(e) => setPages((p) => ({ ...p, returns: { ...p.returns, windowDays: e.target.value } }))} placeholder="7" />
              </div>
            </div>
            <div className="field">
              <label>Refund processing time</label>
              <input value={pages.returns.refundDays} onChange={(e) => setPages((p) => ({ ...p, returns: { ...p.returns, refundDays: e.target.value } }))} placeholder="5–7 business days" />
            </div>
          </div>

          {/* FAQ page */}
          <div className="admin-card">
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 14 }}>FAQ page</div>
            <div className="field">
              <label>Support hours line</label>
              <input value={pages.faq.supportHours} onChange={(e) => setPages((p) => ({ ...p, faq: { ...p.faq, supportHours: e.target.value } }))} placeholder="Mon–Sat · 10am–6pm GMT · Reply within 24 hours" />
            </div>
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
              {uploading['craft_image'] !== false && uploading['craft_image'] !== undefined && <><div className="upload-progress-wrap" style={{ marginTop: 6 }}><div className="upload-progress-bar" style={{ width: `${uploading['craft_image']}%` }} /></div><span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}>{uploading['craft_image']}%</span></>}
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
