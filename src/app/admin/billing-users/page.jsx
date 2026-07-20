'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Pagination from '@/components/Pagination';

const EMPTY = { name: '', email: '', password: '', role: 'cashier', isActive: true };
const PAGE_SIZE = 20;

/**
 * Staff logins for the billing app (NexBill).
 * These accounts can only sign in to the billing app — they have no access to
 * this admin panel or the storefront.
 */
export default function BillingUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);

  // Client-side paging: this list is small, so we fetch once and slice.
  const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const load = () => {
    setLoading(true);
    api.billingUsers
      .list()
      .then(setUsers)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setErr(''); setShowForm(true); };
  const openEdit = (u) => {
    setEditing(u._id);
    // Password intentionally left blank — only sent when the admin types a new one.
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setErr('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) {
        const updated = await api.billingUsers.update(editing, payload);
        setUsers((curr) => curr.map((u) => (u._id === editing ? updated : u)));
      } else {
        const created = await api.billingUsers.create(payload);
        setUsers((curr) => [created, ...curr]);
      }
      setShowForm(false);
      setForm(EMPTY);
      setEditing(null);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this billing login? They will be signed out immediately.')) return;
    try {
      await api.billingUsers.remove(id);
      setUsers((curr) => curr.filter((u) => u._id !== id));
    } catch (e) { setErr(e.message); }
  };

  const toggleActive = async (u) => {
    try {
      const updated = await api.billingUsers.update(u._id, { isActive: !u.isActive });
      setUsers((curr) => curr.map((x) => (x._id === u._id ? updated : x)));
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Billing Users</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>
            Staff logins for the billing app. They can take payments and see stock — but not this admin panel.
          </p>
        </div>
        <button className="btn btn-dark" onClick={openNew}>Add billing user</button>
      </div>

      {err && <div className="err" style={{ marginBottom: 16 }}>{err}</div>}

      {showForm && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase', marginBottom: 16 }}>
            {editing ? 'Edit billing user' : 'New billing user'}
          </h3>
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="field">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Front desk" />
              </div>
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="staff@underdawg.com" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>{editing ? 'New password (leave blank to keep)' : 'Password'}</label>
                <input
                  name="password"
                  type="text"
                  value={form.password}
                  onChange={handleChange}
                  required={!editing}
                  minLength={6}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
              <span style={{ fontSize: 13 }}>Active (can sign in)</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-dark" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create login'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loader">Loading…</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>No billing logins yet.</p>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
            Create one so your staff can sign in to the billing app.
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last sign-in</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'green' : 'red'}`}>
                        {u.isActive ? 'active' : 'disabled'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB') : '—'}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn-sm"
                          onClick={() => handleDelete(u._id)}
                          style={{ color: '#991b1b', border: '1px solid var(--line)', borderRadius: 4, padding: '0 12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={users.length} pageSize={PAGE_SIZE} onChange={setPage} label="users" />
        </div>
      )}
    </div>
  );
}
