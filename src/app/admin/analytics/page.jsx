'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

function getAdminToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('nv_token') || '';
}

async function fetchAdmin(path, params = '') {
  const token = getAdminToken();
  const res = await fetch(`${API_URL}/admin/analytics/${path}${params ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

/* ── Colour palette ─────────────────────────────────────────────────────────── */
const PALETTE = [
  '#111111','#4B5563','#9CA3AF','#D1D5DB',
  '#1D4ED8','#7C3AED','#DB2777','#D97706',
  '#059669','#DC2626','#0891B2','#65A30D',
];

const EVENT_META = {
  pageview:       { label: 'Page View',       color: '#1D4ED8', bg: '#EFF6FF' },
  section_view:   { label: 'Section View',    color: '#059669', bg: '#F0FDF4' },
  click:          { label: 'Click',           color: '#D97706', bg: '#FFFBEB' },
  cart_add:       { label: 'Cart Add',        color: '#7C3AED', bg: '#F5F3FF' },
  cart_remove:    { label: 'Cart Remove',     color: '#DC2626', bg: '#FEF2F2' },
  checkout_start: { label: 'Checkout Start',  color: '#D97706', bg: '#FFFBEB' },
  purchase:       { label: 'Purchase',        color: '#CA8A04', bg: '#FEFCE8' },
  scroll_depth:   { label: 'Scroll',          color: '#9CA3AF', bg: '#F9FAFB' },
};

/* ── Formatters ─────────────────────────────────────────────────────────────── */
function fmtDuration(ms) {
  if (!ms || ms <= 0) return '< 1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) {
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateShort(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function relTime(ts, base) {
  const diff = new Date(ts) - new Date(base);
  if (diff < 1000) return '0s';
  if (diff < 60000) return `+${Math.round(diff / 1000)}s`;
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    const s = Math.round((diff % 60000) / 1000);
    return `+${m}m ${s}s`;
  }
  return `+${Math.floor(diff / 3600000)}h`;
}

function srcIcon(src) {
  const icons = {
    google: '🔍', instagram: '📸', facebook: '👥', twitter: '🐦',
    youtube: '▶️', whatsapp: '💬', email: '✉️', direct: '🔗', referral: '↗',
  };
  return icons[src] || '🌐';
}

/* ── Small stat card ────────────────────────────────────────────────────────── */
function KPI({ label, value, sub }) {
  return (
    <div className="admin-card" style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 32, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* ── Chart options ──────────────────────────────────────────────────────────── */
const baseFont = { family: 'var(--mono)', size: 11 };
const hBarOpts = {
  indexAxis: 'y', responsive: true,
  plugins: { legend: { display: false }, tooltip: { titleFont: baseFont, bodyFont: baseFont } },
  scales: {
    x: { ticks: { font: baseFont, color: '#9CA3AF' }, grid: { color: '#F3F4F6' } },
    y: { ticks: { font: baseFont, color: '#374151' } },
  },
};
const donutOpts = {
  responsive: true,
  plugins: { legend: { position: 'bottom', labels: { font: baseFont, color: '#374151', padding: 12 } }, tooltip: { titleFont: baseFont, bodyFont: baseFont } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SESSION JOURNEY DRAWER                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SessionDrawer({ sid, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!sid) return;
    setLoading(true);
    fetchAdmin(`sessions/${encodeURIComponent(sid)}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sid]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!sid) return null;

  const events  = data?.events || [];
  const first   = events[0];
  const last    = events[events.length - 1];
  const durationMs = first && last ? new Date(last.ts) - new Date(first.ts) : 0;
  const pages   = [...new Set(events.filter(e => e.type === 'pageview').map(e => e.page))];
  const hasPurchase = events.some(e => e.type === 'purchase');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 100, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(560px, 95vw)',
          background: '#fff',
          zIndex: 101,
          display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.12)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600 }}>
                  {sid.slice(0, 16)}…
                </span>
                {hasPurchase && (
                  <span style={{ background: '#FEF3C7', color: '#D97706', fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.08em' }}>
                    CONVERTED
                  </span>
                )}
              </div>
              {first && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {fmtDate(first.ts)} · {fmtTime(first.ts)}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-soft)', lineHeight: 1, padding: 4 }}
            >
              ✕
            </button>
          </div>

          {/* Session meta chips */}
          {first && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {[
                first.device && `${first.device}`,
                first.browser && `${first.browser}`,
                first.os && `${first.os}`,
                (first.city || first.country) && `${first.city || ''}${first.city && first.country ? ', ' : ''}${first.country || ''}`,
                first.src && `${srcIcon(first.src)} ${first.src}`,
              ].filter(Boolean).map((chip, i) => (
                <span key={i} style={{ background: '#F3F4F6', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: 11, color: '#374151', textTransform: 'capitalize' }}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 14 }}>
            {[
              { l: 'Duration',  v: fmtDuration(durationMs) },
              { l: 'Events',    v: events.length },
              { l: 'Pages',     v: pages.length },
              { l: 'User',      v: first?.uid?.name ? first.uid.name.split(' ')[0] : 'Guest' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: '#F9FAFB', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-soft)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Page journey breadcrumb */}
          {pages.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 6 }}>Page journey</div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                {pages.map((p, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ background: '#F3F4F6', borderRadius: 4, padding: '2px 8px', fontFamily: 'var(--mono)', fontSize: 11 }}>
                      {p || '/'}
                    </span>
                    {i < pages.length - 1 && <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline body */}
        <div style={{ flex: 1, padding: '20px 24px' }}>
          {loading ? (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>Loading events…</p>
          ) : events.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No events found for this session.</p>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Vertical line */}
              <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: '#F3F4F6' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map((ev, i) => {
                  const meta = EVENT_META[ev.type] || { label: ev.type, color: '#6B7280', bg: '#F9FAFB' };
                  const isLast = i === events.length - 1;

                  return (
                    <div key={ev._id || i} style={{ display: 'flex', gap: 16, paddingBottom: isLast ? 0 : 16 }}>
                      {/* Dot */}
                      <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: '50%',
                          background: meta.bg,
                          border: `2px solid ${meta.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13,
                        }}>
                          {ev.type === 'pageview'       && '📄'}
                          {ev.type === 'section_view'   && '👁'}
                          {ev.type === 'click'          && '👆'}
                          {ev.type === 'cart_add'       && '🛒'}
                          {ev.type === 'cart_remove'    && '✕'}
                          {ev.type === 'checkout_start' && '💳'}
                          {ev.type === 'purchase'       && '✅'}
                          {ev.type === 'scroll_depth'   && '↕'}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{
                            background: meta.bg,
                            color: meta.color,
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontWeight: 600,
                          }}>
                            {meta.label}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                            {fmtTime(ev.ts)}
                          </span>
                          {first && i > 0 && (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#D1D5DB' }}>
                              {relTime(ev.ts, first.ts)}
                            </span>
                          )}
                        </div>

                        {/* Page path */}
                        {ev.page && (
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#374151', marginBottom: 3 }}>
                            {ev.page}
                          </div>
                        )}

                        {/* Event-specific data */}
                        {ev.data && Object.keys(ev.data).length > 0 && (
                          <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#4B5563', display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                            {ev.data.label     && <span><b>button:</b> {ev.data.label}</span>}
                            {ev.data.section   && <span><b>section:</b> {ev.data.section}</span>}
                            {ev.data.title     && <span><b>product:</b> {ev.data.title}</span>}
                            {ev.data.depth     && <span><b>depth:</b> {ev.data.depth}%</span>}
                            {ev.data.itemCount && <span><b>items:</b> {ev.data.itemCount}</span>}
                            {ev.data.orderNumber && <span><b>order:</b> {ev.data.orderNumber}</span>}
                            {ev.data.price     && <span><b>price:</b> £{ev.data.price?.toLocaleString('en-GB')}</span>}
                            {ev.data.total     && <span><b>total:</b> £{ev.data.total?.toLocaleString('en-GB')}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SESSIONS TAB                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */
function SessionsTab() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(sevenAgo);
  const [endDate,   setEndDate]   = useState(today);
  const [quickRange, setQuickRange] = useState('7d');
  const [page,      setPage]      = useState(1);
  const [data,      setData]      = useState({ sessions: [], total: 0, pages: 1 });
  const [loading,   setLoading]   = useState(false);
  const [activeSid, setActiveSid] = useState(null);

  const QUICK = [
    { label: 'Today',   value: 'today' },
    { label: '7 days',  value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = quickRange === 'custom'
        ? `start=${startDate}&end=${endDate}&page=${page}&limit=25`
        : `range=${quickRange}&page=${page}&limit=25`;
      const res = await fetchAdmin('sessions', params);
      setData(res);
    } catch {
      setData({ sessions: [], total: 0, pages: 1 });
    }
    setLoading(false);
  }, [quickRange, startDate, endDate, page]);

  useEffect(() => { load(); }, [load]);

  const applyQuick = (v) => {
    setQuickRange(v);
    setPage(1);
    if (v !== 'custom') {
      if (v === 'today') { setStartDate(today); setEndDate(today); }
      if (v === '7d')    { setStartDate(sevenAgo); setEndDate(today); }
      if (v === '30d')   { setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)); setEndDate(today); }
      if (v === '90d')   { setStartDate(new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)); setEndDate(today); }
    }
  };

  return (
    <>
      {activeSid && <SessionDrawer sid={activeSid} onClose={() => setActiveSid(null)} />}

      {/* Date controls */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {QUICK.map((r) => (
            <button key={r.value} onClick={() => applyQuick(r.value)}
              style={{ padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer', background: quickRange === r.value ? '#111' : 'transparent', color: quickRange === r.value ? '#fff' : 'var(--ink)' }}>
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={startDate} max={endDate}
            onChange={(e) => { setStartDate(e.target.value); setQuickRange('custom'); setPage(1); }}
            style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--ink)' }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>to</span>
          <input type="date" value={endDate} min={startDate} max={today}
            onChange={(e) => { setEndDate(e.target.value); setQuickRange('custom'); setPage(1); }}
            style={{ fontFamily: 'var(--mono)', fontSize: 12, padding: '5px 8px', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--ink)' }} />
        </div>

        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
          {data.total} session{data.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>Loading…</p>
        ) : data.sessions.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--ink-soft)' }}>No sessions found for this date range.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Pages</th>
                  <th>Events</th>
                  <th>Device</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((s) => (
                  <tr
                    key={s.sid}
                    onClick={() => setActiveSid(s.sid)}
                    style={{ cursor: 'pointer' }}
                    className="analytics-session-row"
                  >
                    <td>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#374151' }}>
                        {s.sid.slice(0, 12)}…
                      </div>
                      {s.uid?.name && (
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{s.uid.name}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{fmtDateShort(s.firstSeen)}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{fmtTime(s.firstSeen)}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtDuration(s.durationMs)}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center' }}>{s.pageCount}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, textAlign: 'center' }}>{s.eventCount}</td>
                    <td>
                      <div style={{ fontSize: 12, textTransform: 'capitalize' }}>{s.device || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{s.browser || ''}</div>
                    </td>
                    <td>
                      {(s.city || s.country) ? (
                        <>
                          <div style={{ fontSize: 12 }}>{s.city || s.country}</div>
                          {s.city && s.country && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 1 }}>{s.country}</div>}
                        </>
                      ) : <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{srcIcon(s.src)}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, marginLeft: 4, textTransform: 'capitalize' }}>{s.src || 'direct'}</span>
                    </td>
                    <td>
                      {s.purchased
                        ? <span style={{ background: '#FEF3C7', color: '#D97706', fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.08em' }}>CONVERTED</span>
                        : <span style={{ background: '#F3F4F6', color: '#6B7280', fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.08em' }}>BROWSING</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 12px', border: '1px solid var(--line)', borderRadius: 4, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, background: 'transparent' }}
            >
              ← Prev
            </button>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
              Page {page} of {data.pages}
            </span>
            <button
              disabled={page >= data.pages}
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '5px 12px', border: '1px solid var(--line)', borderRadius: 4, cursor: page >= data.pages ? 'not-allowed' : 'pointer', opacity: page >= data.pages ? 0.4 : 1, background: 'transparent' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>
        Click any row to view the full user journey for that session.
      </p>

      <style>{`
        .analytics-session-row:hover td { background: #F9FAFB; }
        .analytics-session-row td { transition: background 0.15s; }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  OTHER TABS (unchanged from before)                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */
function OverviewTab({ summary, timeline }) {
  const labels = timeline.map((r) => {
    const d = new Date(r.date + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  });

  const totalPV = timeline.reduce((s, r) => s + r.pageviews, 0);
  const totalSS = timeline.reduce((s, r) => s + r.sessions, 0);

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Pageviews',
        data: timeline.map((r) => r.pageviews),
        borderColor: '#111111',
        borderWidth: 2,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(17,17,17,0.1)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(17,17,17,0.13)');
          g.addColorStop(1, 'rgba(17,17,17,0)');
          return g;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#111',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Sessions',
        data: timeline.map((r) => r.sessions),
        borderColor: '#7C3AED',
        borderWidth: 2,
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#7C3AED',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111',
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.7)',
        titleFont: { family: 'var(--mono)', size: 11, weight: '600' },
        bodyFont: { family: 'var(--mono)', size: 11 },
        padding: { top: 9, bottom: 9, left: 13, right: 13 },
        cornerRadius: 6,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 5,
        callbacks: {
          label: (item) => `  ${item.dataset.label}: ${item.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          font: { family: 'var(--mono)', size: 10 },
          color: '#9CA3AF',
          maxRotation: 0,
          maxTicksLimit: 9,
        },
      },
      y: {
        border: { display: false },
        grid: { color: '#F3F4F6', lineWidth: 1 },
        ticks: {
          font: { family: 'var(--mono)', size: 10 },
          color: '#9CA3AF',
          padding: 8,
          maxTicksLimit: 5,
          callback: (v) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <KPI label="Sessions"        value={summary.sessions?.toLocaleString()  ?? '—'} />
        <KPI label="Pageviews"       value={summary.pageviews?.toLocaleString() ?? '—'} />
        <KPI label="Unique visitors" value={summary.visitors?.toLocaleString()  ?? '—'} />
        <KPI label="Cart adds"       value={summary.cartAdds?.toLocaleString()  ?? '—'} />
        <KPI label="Purchases"       value={summary.purchases?.toLocaleString() ?? '—'} />
        <KPI label="Conv. rate"      value={`${summary.conversionRate ?? '0.0'}%`} sub="purchases / sessions" />
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {timeline.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
            No traffic data yet for this range.
          </div>
        ) : (
          <>
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '18px 22px 16px', borderBottom: '1px solid var(--line)' }}>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Traffic over time</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 4, letterSpacing: '0.08em' }}>
                  {new Date(timeline[0].date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' – '}
                  {new Date(timeline[timeline.length - 1].date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Legend + totals */}
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { label: 'Pageviews', value: totalPV, color: '#111', dashed: false },
                  { label: 'Sessions',  value: totalSS, color: '#7C3AED', dashed: true },
                ].map(({ label, value, color, dashed }) => (
                  <div key={label} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 }}>
                      <svg width="20" height="10" viewBox="0 0 20 10">
                        {dashed
                          ? <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2" strokeDasharray="5,4" />
                          : <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth="2" />
                        }
                      </svg>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div style={{ padding: '20px 16px 14px', height: 280 }}>
              <Line data={lineData} options={chartOpts} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function TrafficTab({ sources }) {
  const total = sources.reduce((s, r) => s + r.sessions, 0);
  const donutData = {
    labels: sources.map((r) => r.source),
    datasets: [{ data: sources.map((r) => r.sessions), backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }],
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="admin-card">
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase', marginBottom: 16 }}>Sources</h3>
        {sources.length > 0 ? <Doughnut data={donutData} options={donutOpts} /> : <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No data yet.</p>}
      </div>
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase' }}>Breakdown</h3>
        </div>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Source</th><th>Sessions</th><th>Share</th></tr></thead>
          <tbody>
            {sources.map((r) => (
              <tr key={r.source}>
                <td style={{ textTransform: 'capitalize' }}>{srcIcon(r.source)} {r.source}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.sessions}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}>{total > 0 ? `${((r.sessions / total) * 100).toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

function BehaviorTab({ pages, sections, clicks }) {
  const totalViews = pages.reduce((s, r) => s + r.views, 0);
  const sectionData = {
    labels: sections.map((r) => r.section),
    datasets: [{ label: 'Views', data: sections.map((r) => r.views), backgroundColor: '#111' }],
  };
  return (
    <>
      <div className="admin-card" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase' }}>Top pages</h3>
        </div>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Page</th><th>Views</th><th>Sessions</th><th>Share</th></tr></thead>
          <tbody>
            {pages.slice(0, 15).map((r) => (
              <tr key={r.page}>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.page || '/'}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.views}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>{r.sessions}</td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}>{totalViews > 0 ? `${((r.views / totalViews) * 100).toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="admin-card">
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase', marginBottom: 16 }}>Section engagement</h3>
          {sections.length > 0 ? <Bar data={sectionData} options={hBarOpts} /> : <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No section data yet.</p>}
        </div>
        <div className="admin-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase' }}>Top CTA clicks</h3>
          </div>
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>Button / CTA</th><th>Clicks</th></tr></thead>
            <tbody>
              {clicks.length === 0
                ? <tr><td colSpan={2} style={{ color: 'var(--ink-soft)', fontSize: 12 }}>No click data yet.</td></tr>
                : clicks.map((r) => <tr key={r.label}><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.label}</td><td style={{ fontFamily: 'var(--mono)' }}>{r.clicks}</td></tr>)
              }
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  );
}

function DevicesTab({ devices }) {
  const mk = (arr) => ({
    labels: arr.map((r) => r._id),
    datasets: [{ data: arr.map((r) => r.count), backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }],
  });
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { title: 'Device type', data: devices.devices  || [] },
          { title: 'Browser',     data: devices.browsers || [] },
          { title: 'OS',          data: devices.oses     || [] },
        ].map(({ title, data }) => (
          <div key={title} className="admin-card">
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 14, textTransform: 'uppercase', marginBottom: 14 }}>{title}</h3>
            {data.length > 0 ? <Doughnut data={mk(data)} options={donutOpts} /> : <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>No data yet.</p>}
          </div>
        ))}
      </div>
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 14, textTransform: 'uppercase' }}>Screen resolutions</h3>
        </div>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Resolution</th><th>Count</th></tr></thead>
          <tbody>
            {(devices.screens || []).map((r) => (
              <tr key={r._id}><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r._id}</td><td style={{ fontFamily: 'var(--mono)' }}>{r.count}</td></tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

function LocationTab({ locations }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[
        { title: 'Countries', rows: locations.countries || [], key: 'country' },
        { title: 'Cities',    rows: locations.cities    || [], key: 'city' },
      ].map(({ title, rows, key }) => (
        <div key={title} className="admin-card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase' }}>{title}</h3>
          </div>
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>{title.slice(0, -1)}</th><th>Visitors</th></tr></thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={2} style={{ color: 'var(--ink-soft)', fontSize: 12 }}>No location data yet.</td></tr>
                : rows.map((r) => <tr key={r[key]}><td>{r[key]}</td><td style={{ fontFamily: 'var(--mono)' }}>{r.visitors}</td></tr>)
              }
            </tbody>
          </table></div>
        </div>
      ))}
    </div>
  );
}

function FunnelTab({ funnel }) {
  const max = funnel[0]?.count || 1;
  const STEP_COLORS = ['#111', '#4B5563', '#9CA3AF', '#D1D5DB'];
  return (
    <div className="admin-card">
      <h3 style={{ fontFamily: 'var(--display)', fontSize: 16, textTransform: 'uppercase', marginBottom: 24 }}>Conversion funnel</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {funnel.map((step, i) => {
          const width = max > 0 ? Math.max(8, (step.count / max) * 100) : 8;
          return (
            <div key={step.step}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{step.step}</span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}>
                  {step.count.toLocaleString()}{i > 0 && ` · ${step.pct}% of prev`}
                </span>
              </div>
              <div style={{ background: '#F3F4F6', borderRadius: 4, height: 28, overflow: 'hidden' }}>
                <div style={{ width: `${width}%`, height: '100%', background: STEP_COLORS[i] || '#111', borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 10, transition: 'width 0.6s ease' }}>
                  {width > 15 && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: i < 2 ? '#fff' : '#374151' }}>{step.pct}%</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 20 }}>
        Funnel: product page views → add-to-cart events → checkout starts → completed purchases.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
const TABS   = ['Overview', 'Sessions', 'Traffic', 'Behavior', 'Devices', 'Location', 'Funnel'];
const RANGES = [
  { label: 'Today',   value: 'today' },
  { label: '7 days',  value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

export default function AnalyticsPage() {
  const [tab,     setTab]     = useState('Overview');
  const [range,   setRange]   = useState('7d');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [summary,   setSummary]   = useState({});
  const [timeline,  setTimeline]  = useState([]);
  const [sources,   setSources]   = useState([]);
  const [pages,     setPages]     = useState([]);
  const [sections,  setSections]  = useState([]);
  const [clicks,    setClicks]    = useState([]);
  const [devices,   setDevices]   = useState({});
  const [locations, setLocations] = useState({});
  const [funnel,    setFunnel]    = useState([]);

  const loadAll = useCallback(async () => {
    if (tab === 'Sessions') return; // Sessions tab manages its own data
    setLoading(true);
    setError('');
    try {
      const q = `range=${range}`;
      const [sum, tl, src, pg, sec, clk, dev, loc, fn] = await Promise.all([
        fetchAdmin('summary',   q),
        fetchAdmin('timeline',  q),
        fetchAdmin('sources',   q),
        fetchAdmin('pages',     q),
        fetchAdmin('sections',  q),
        fetchAdmin('clicks',    q),
        fetchAdmin('devices',   q),
        fetchAdmin('locations', q),
        fetchAdmin('funnel',    q),
      ]);
      setSummary(sum); setTimeline(tl); setSources(src); setPages(pg);
      setSections(sec); setClicks(clk); setDevices(dev); setLocations(loc); setFunnel(fn);
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    }
    setLoading(false);
  }, [range, tab]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return (
    <div>
      <div className="admin-topbar" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <h1 className="admin-page-title" style={{ flex: 1 }}>Analytics</h1>

        {/* Range selector — only shown outside Sessions tab */}
        {tab !== 'Sessions' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {RANGES.map((r) => (
              <button key={r.value} onClick={() => setRange(r.value)}
                style={{ padding: '5px 12px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--line)', borderRadius: 4, cursor: 'pointer', background: range === r.value ? '#111' : 'transparent', color: range === r.value ? '#fff' : 'var(--ink)' }}>
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 18px', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderBottom: tab === t ? '2px solid #111' : '2px solid transparent', background: 'transparent', cursor: 'pointer', color: tab === t ? '#111' : 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Sessions tab renders independently */}
      {tab === 'Sessions' && <SessionsTab />}

      {tab !== 'Sessions' && loading && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-soft)' }}>Loading…</p>
      )}
      {tab !== 'Sessions' && error && !loading && (
        <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{error}</p>
      )}
      {tab !== 'Sessions' && !loading && !error && (
        <>
          {tab === 'Overview'  && <OverviewTab  summary={summary}   timeline={timeline} />}
          {tab === 'Traffic'   && <TrafficTab   sources={sources} />}
          {tab === 'Behavior'  && <BehaviorTab  pages={pages} sections={sections} clicks={clicks} />}
          {tab === 'Devices'   && <DevicesTab   devices={devices} />}
          {tab === 'Location'  && <LocationTab  locations={locations} />}
          {tab === 'Funnel'    && <FunnelTab    funnel={funnel} />}
        </>
      )}
    </div>
  );
}
