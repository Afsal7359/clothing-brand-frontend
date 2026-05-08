const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
const UPLOADS_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5005';

function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nv_token');
}

function getUserToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nv_user_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getAdminToken();
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;
  const userToken = getUserToken();
  if (userToken && options.userAuth) headers['x-user-token'] = `Bearer ${userToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: options.cache || 'no-store',
  });

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Resolves relative upload paths to full URLs
export function resolveImage(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/uploads/')) return `${UPLOADS_URL}${src}`;
  return src;
}

// Public
export const api = {
  products: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/products${qs ? `?${qs}` : ''}`);
    },
    get: (slug) => request(`/products/${slug}`),
    create: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  collections: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/collections${qs ? `?${qs}` : ''}`);
    },
    get: (slug) => request(`/collections/${slug}`),
    create: (body) => request('/collections', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/collections/${id}`, { method: 'DELETE' }),
  },
  orders: {
    create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body), auth: false }),
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/orders${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/orders/${id}`),
    updateStatus: (id, body) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
    myOrders: () => request('/orders/my', { userAuth: true }),
    myOrder: (id) => request(`/orders/my/${id}`, { userAuth: true }),
  },
  settings: {
    get: () => request('/settings'),
    update: (body) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
  },
  coupons: {
    list: () => request('/coupons'),
    create: (body) => request('/coupons', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),
    validate: (body) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(body), auth: false }),
  },
  auth: {
    me: () => request('/auth/me', { auth: false, userAuth: true }),
    updateProfile: (body) => request('/auth/me', { method: 'PUT', body: JSON.stringify(body), auth: false, userAuth: true }),
  },
  admin: {
    login: (body) => request('/admin/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
    me: () => request('/admin/me'),
    upload: async (files) => {
      const fd = new FormData();
      for (const f of files) fd.append('files', f);
      const token = getAdminToken();
      const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    // Direct browser→Cloudinary upload — no backend relay, real progress
    uploadWithProgress: async (files, onProgress) => {
      const token = getAdminToken();

      // 1. Get a signed upload credential from backend (instant — pure crypto)
      const sigRes = await fetch(`${API_URL}/admin/upload-signature`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!sigRes.ok) throw new Error('Failed to get upload credentials');
      const { signature, timestamp, api_key, cloud_name, folder } = await sigRes.json();

      // 2. Upload each file directly to Cloudinary with real XHR progress
      const uploadOne = (file) => new Promise((resolve, reject) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('api_key', api_key);
        fd.append('timestamp', String(timestamp));
        fd.append('signature', signature);
        fd.append('folder', folder);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Invalid Cloudinary response')); }
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).error?.message || 'Upload failed')); }
            catch { reject(new Error('Upload failed')); }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(fd);
      });

      const results = await Promise.all(files.map(uploadOne));
      return { urls: results.map((r) => r.secure_url).filter(Boolean) };
    },
  },
};
