'use client';

import Link from 'next/link';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <>
      <div className="admin-head">
        <h1>New product</h1>
        <Link href="/admin/products" className="link-arrow">← Back to products</Link>
      </div>
      <ProductForm />
    </>
  );
}
