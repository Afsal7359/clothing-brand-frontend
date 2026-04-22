'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('nv_token');
    if (!token) {
      setLoading(false);
      if (pathname !== '/admin/login') router.replace('/admin/login');
      return;
    }
    api.admin
      .me()
      .then((res) => setAdmin(res.admin))
      .catch(() => {
        localStorage.removeItem('nv_token');
        router.replace('/admin/login');
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const login = async (email, password) => {
    const res = await api.admin.login({ email, password });
    localStorage.setItem('nv_token', res.token);
    setAdmin(res.admin);
    router.replace('/admin');
  };

  const logout = () => {
    localStorage.removeItem('nv_token');
    setAdmin(null);
    router.replace('/admin/login');
  };

  return (
    <AdminContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
