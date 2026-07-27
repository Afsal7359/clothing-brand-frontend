'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/context/AdminContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/collections', label: 'Collections' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/coupons', label: 'Coupons' },
    { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/billing-users', label: 'Billing Users' },
  { href: '/admin/notifications', label: 'Notifications' },
    { href: '/admin/site', label: 'Site Settings' },
  ];

  const isActive = (href) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="admin-side">
      <Link href="/" className="logo">
        underdawg
      </Link>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={isActive(l.href) ? 'active' : ''}>
          {l.label}
        </Link>
      ))}
      <button className="admin-logout" onClick={logout}>
        {admin?.email || 'Admin'} · Log out
      </button>
    </nav>
  );
}
