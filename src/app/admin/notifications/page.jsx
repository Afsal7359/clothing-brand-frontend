'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Each toggleable notification, with plain-English descriptions. */
const EVENTS = [
  {
    key: 'websiteOrder',
    label: 'New website order',
    desc: 'A customer buys on the online shop — the till is notified instantly so staff can pack it.',
  },
  {
    key: 'dailySummary',
    label: 'Daily sales summary',
    desc: "One notification at the end of each day with the day's totals.",
  },
  {
    key: 'paymentReceived',
    label: 'Payment received',
    desc: 'Someone settles an outstanding invoice or clears a balance.',
  },
  {
    key: 'outOfStock',
    label: 'Out of stock',
    desc: 'A product drops to zero stock after a sale.',
  },
];

export default function NotificationsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setData(await api.notifications.get());
      setErr('');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const patch = async (body) => {
    setSaving(true); setErr(''); setMsg('');
    try {
      const settings = await api.notifications.update(body);
      setData((d) => ({ ...d, settings }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setSaving(true); setErr(''); setMsg('');
    try {
      const r = await api.notifications.test();
      setMsg(
        r.sent > 0
          ? `Test sent to ${r.sent} device${r.sent === 1 ? '' : 's'}.`
          : r.skipped === 'no-subscribers'
            ? 'No devices are registered yet — open the billing app and turn notifications on there first.'
            : `Nothing sent (${r.skipped || 'unknown reason'}).`
      );
      if (r.removed) setMsg((m) => `${m} Removed ${r.removed} expired device(s).`);
      load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeDevice = async (id) => {
    if (!confirm('Stop sending notifications to this device?')) return;
    try {
      await api.notifications.removeDevice(id);
      setData((d) => ({ ...d, devices: d.devices.filter((x) => x.id !== id) }));
    } catch (e) {
      setErr(e.message);
    }
  };

  if (loading) return <div className="loader">Loading…</div>;

  const s = data?.settings || {};
  const events = s.events || {};

  return (
    <div>
      <div className="admin-head">
        <h1>Notifications</h1>
        <div>
          <button className="btn btn-outline btn-sm" onClick={sendTest} disabled={saving}>
            Send test
          </button>
        </div>
      </div>

      {err && <div className="err">{err}</div>}
      {msg && (
        <div className="admin-card" style={{ marginBottom: 20, borderLeft: '3px solid #16a34a' }}>
          <p style={{ fontSize: 13.5, margin: 0 }}>{msg}</p>
        </div>
      )}

      {!data?.available && (
        <div className="admin-card" style={{ marginBottom: 20, borderLeft: '3px solid #b45309' }}>
          <p style={{ fontSize: 13.5, margin: 0 }}>
            Push keys aren&apos;t configured on the server, so nothing will be delivered.
            Set <code style={{ fontFamily: 'var(--mono)' }}>VAPID_PUBLIC_KEY</code> and{' '}
            <code style={{ fontFamily: 'var(--mono)' }}>VAPID_PRIVATE_KEY</code> in the backend
            environment and restart.
          </p>
        </div>
      )}

      {/* Master switch */}
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!s.enabled}
            disabled={saving}
            onChange={(e) => patch({ enabled: e.target.checked })}
            style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
          />
          <span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Enable notifications</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-mute)', marginTop: 3, lineHeight: 1.5 }}>
              Master switch. When off, nothing is sent regardless of the settings below.
            </span>
          </span>
        </label>
      </div>

      {/* Per-event toggles */}
      <div className="admin-card" style={{ marginBottom: 20, opacity: s.enabled ? 1 : 0.55 }}>
        <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 16 }}>
          What to notify about
        </h3>
        {EVENTS.map((ev, i) => (
          <label
            key={ev.key}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
              paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0,
              borderTop: i ? '1px solid var(--line)' : 'none',
            }}
          >
            <input
              type="checkbox"
              checked={!!events[ev.key]}
              disabled={saving || !s.enabled}
              onChange={(e) => patch({ events: { [ev.key]: e.target.checked } })}
              style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
            />
            <span>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{ev.label}</span>
              <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-mute)', marginTop: 3, lineHeight: 1.5 }}>
                {ev.desc}
              </span>
              {ev.key === 'dailySummary' && events.dailySummary && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13 }}>Send at</span>
                  <select
                    value={s.dailySummaryHour ?? 20}
                    disabled={saving}
                    onChange={(e) => patch({ dailySummaryHour: Number(e.target.value) })}
                    onClick={(e) => e.preventDefault()}
                    style={{ maxWidth: 110 }}
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>UK time</span>
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      {/* Quiet hours */}
      <div className="admin-card" style={{ marginBottom: 20, opacity: s.enabled ? 1 : 0.55 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!s.quietHours?.enabled}
            disabled={saving || !s.enabled}
            onChange={(e) => patch({ quietHours: { enabled: e.target.checked } })}
            style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
          />
          <span>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>Quiet hours</span>
            <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-mute)', marginTop: 3, lineHeight: 1.5 }}>
              Don&apos;t send notifications overnight. (A test send always goes through.)
            </span>
          </span>
        </label>
        {s.quietHours?.enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginLeft: 30, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>From</span>
            <select value={s.quietHours.from ?? 22} disabled={saving}
              onChange={(e) => patch({ quietHours: { from: Number(e.target.value) } })} style={{ maxWidth: 100 }}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
            <span style={{ fontSize: 13 }}>to</span>
            <select value={s.quietHours.to ?? 8} disabled={saving}
              onChange={(e) => patch({ quietHours: { to: Number(e.target.value) } })} style={{ maxWidth: 100 }}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Registered devices */}
      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px 0' }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 4 }}>
            Devices ({data?.devices?.length || 0})
          </h3>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 14, lineHeight: 1.5 }}>
            Staff devices that will receive notifications. A device appears here after someone turns
            notifications on inside the billing app.
            <br />
            <strong>iPhone/iPad:</strong> the app must be added to the Home Screen first — Safari does
            not deliver notifications to a normal browser tab.
          </p>
        </div>

        {data?.devices?.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Staff</th><th>Device</th><th>Last used</th><th></th></tr>
              </thead>
              <tbody>
                {data.devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.user ? (
                        <>
                          <div style={{ fontWeight: 500 }}>{d.user.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>{d.user.email}</div>
                        </>
                      ) : <span style={{ color: 'var(--ink-mute)' }}>—</span>}
                    </td>
                    <td>{d.label}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
                      {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString('en-GB') : '—'}
                    </td>
                    <td>
                      <button className="btn-sm" onClick={() => removeDevice(d.id)}
                        style={{ color: '#991b1b', border: '1px solid var(--line)', borderRadius: 4, padding: '0 12px' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '10px 20px 26px' }}>
            No devices registered yet.
          </div>
        )}
      </div>
    </div>
  );
}
