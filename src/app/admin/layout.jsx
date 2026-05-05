'use client';

import { usePathname } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import AdminSidebar from '@/components/AdminSidebar';

function AdminShell({ children }) {
  const pathname = usePathname();
  const { loading, admin } = useAdmin();

  if (pathname === '/admin/login') return <>{children}</>;
  if (loading) return <div className="loader">Loading…</div>;
  if (!admin) return null;

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
