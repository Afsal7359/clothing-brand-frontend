'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/ProductForm';
import { api } from '@/lib/api';

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.products
      .get(id)
      .then((p) => setProduct(p))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loader">Loading…</div>;
  if (err || !product)
    return (
      <div className="empty-state">
        <p>{err || 'Product not found'}</p>
        <Link href="/admin/products" className="btn btn-dark btn-sm">Back</Link>
      </div>
    );

  return (
    <>
      <div className="admin-head">
        <h1>Edit: {product.title}</h1>
        <Link href="/admin/products" className="link-arrow">← Back to products</Link>
      </div>
      <ProductForm initial={product} />
    </>
  );
}
