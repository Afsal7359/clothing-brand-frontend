const SESSION_KEY = 'ud_sid';
const REF_KEY     = 'ud_ref';
const UTM_KEY     = 'ud_utm';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

/* ── Session ID ────────────────────────────────────────────────────────────── */
function getSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'nostorage';
  }
}

/* ── Traffic source classifier ─────────────────────────────────────────────── */
function classifySource(referrer, utm) {
  if (utm?.source) return utm.source;
  if (!referrer) return 'direct';
  const r = referrer.toLowerCase();
  if (r.includes('google.'))    return 'google';
  if (r.includes('instagram.') || r.includes('ig.me')) return 'instagram';
  if (r.includes('facebook.')  || r.includes('fb.com')) return 'facebook';
  if (r.includes('twitter.')   || r.includes('x.com'))  return 'twitter';
  if (r.includes('youtube.'))   return 'youtube';
  if (r.includes('whatsapp.'))  return 'whatsapp';
  if (utm?.medium === 'email')  return 'email';
  return 'referral';
}

/* ── Event queue ────────────────────────────────────────────────────────────── */
let queue = [];
let flushTimer = null;

function flush() {
  if (typeof window === 'undefined' || queue.length === 0) return;
  const payload = JSON.stringify({ events: queue });
  queue = [];
  const url = `${API_BASE}/events`;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(url, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // never throw — analytics must never break the app
  }
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

/** Call once when the app boots (client side) */
export function initSession() {
  if (typeof window === 'undefined') return;

  // Capture referrer once per session
  try {
    if (!sessionStorage.getItem(REF_KEY)) {
      sessionStorage.setItem(REF_KEY, document.referrer || '');
    }
    // Capture UTM params if present in URL
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    ['source', 'medium', 'campaign', 'term', 'content'].forEach((k) => {
      const v = params.get(`utm_${k}`);
      if (v) utm[k] = v;
    });
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  } catch { /* ignore */ }

  // Flush remaining events before page closes
  window.addEventListener('pagehide',      flush, { once: false });
  window.addEventListener('beforeunload',  flush, { once: false });
}

/** Track a single event */
export function track(type, page, data = {}) {
  if (typeof window === 'undefined') return;
  try {
    const sid = getSessionId();
    const ref = sessionStorage.getItem(REF_KEY) || '';
    const utm = JSON.parse(sessionStorage.getItem(UTM_KEY) || 'null') || {};
    const src = classifySource(ref, utm);

    queue.push({
      sid,
      type,
      page,
      data,
      ref,
      src,
      utm,
      screen: `${window.screen.width}x${window.screen.height}`,
      ts: new Date().toISOString(),
    });

    if (queue.length >= 5) {
      clearTimeout(flushTimer);
      flush();
    } else {
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 3000);
    }
  } catch { /* never throw */ }
}
