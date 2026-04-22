import { api, resolveImage } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductActions from './ProductActions';
import { notFound } from 'next/navigation';

export const revalidate = 60;

async function getProduct(slug) {
  try {
    return await api.products.get(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product not found — NORTHVERSE' };
  return {
    title: `${product.title} — NORTHVERSE`,
    description: product.description?.slice(0, 160) || product.title,
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <div className="pdp">
        <div className="pdp-gallery">
          {(product.images || []).slice(0, 8).map((src, i) => (
            <img key={i} src={resolveImage(src)} alt={`${product.title} view ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} />
          ))}
        </div>

        <aside className="pdp-info">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            {product.category}
          </div>
          <h1 className="pdp-title">{product.title}</h1>
          <div className="pdp-price">
            {onSale && <span className="strike">₹{product.compareAtPrice.toLocaleString('en-IN')}</span>}
            <span style={{ fontWeight: 600 }}>₹{product.price.toLocaleString('en-IN')}</span>
            {onSale && (
              <span className="badge red" style={{ marginLeft: 4 }}>
                -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
              </span>
            )}
          </div>

          <ProductActions product={product} />

          {product.description && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                Description
              </div>
              <p className="pdp-desc">{product.description}</p>
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 13, lineHeight: 1.8, color: 'var(--ink-soft)' }}>
            <div>Free shipping across India on orders above ₹2,500</div>
            <div>7-day easy returns &amp; exchanges</div>
            <div>COD available at checkout</div>
          </div>
        </aside>
      </div>

      <Footer />
    </>
  );
}
