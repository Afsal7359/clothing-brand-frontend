'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, collections: 0, orders: 0, pending: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prods, cols, orders, pending] = await Promise.all([
          api.products.list({ limit: 1 }),
          api.collections.list({ active: 'false' }),
          api.orders.list({ limit: 5 }),
          api.orders.list({ status: 'pending', limit: 1 }),
        ]);
        setRecentOrders(orders.items || []);
        const revenue = (orders.items || []).reduce((sum, o) => sum + (o.total || 0), 0);
        setStats({
          products: prods.total || 0,
          collections: (cols.items || []).length,
          orders: orders.total || 0,
          pending: pending.total || 0,
          revenue,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loader">Loading dashboard…</div>;

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/products/new" className="btn btn-dark btn-sm">+ New product</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">Products</div>
          <div className="value">{stats.products}</div>
        </div>
        <div className="stat">
          <div className="label">Collections</div>
          <div className="value">{stats.collections}</div>
        </div>
        <div className="stat">
          <div className="label">Total Orders</div>
          <div className="value">{stats.orders}</div>
        </div>
        <div className="stat">
          <div className="label">Pending</div>
          <div className="value">{stats.pending}</div>
        </div>
        <div className="stat">
          <div className="label">Recent Revenue</div>
          <div className="value" style={{ fontSize: 22 }}>£{stats.revenue.toLocaleString('en-GB')}</div>
        </div>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--display)', fontSize: 18, textTransform: 'uppercase' }}>Recent orders</h3>
          <Link href="/admin/orders" className="link-arrow">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state">No orders yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Email</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'var(--mono)' }}>{o.orderNumber}</td>
                    <td>{o.email}</td>
                    <td>{o.items.length}</td>
                    <td>£{o.total.toLocaleString('en-GB')}</td>
                    <td>
                      <span className={`badge ${o.status === 'pending' ? 'amber' : o.status === 'delivered' ? 'green' : 'blue'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
