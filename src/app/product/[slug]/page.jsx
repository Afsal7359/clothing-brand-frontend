import { api, resolveImage } from '@/lib/api';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductActions from './ProductActions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

const DEFAULT_SHIPPING_INFO = [
  'Free shipping on orders above £250',
  '7-day easy returns & exchanges',
  'UK delivery 2–5 working days',
  'Secure payments with Stripe',
];

async function getProduct(slug) {
  try {
    return await api.products.get(slug);
  } catch {
    return null;
  }
}

async function getShippingInfo() {
  try {
    const s = await api.settings.get();
    return s.shippingInfo?.length ? s.shippingInfo : DEFAULT_SHIPPING_INFO;
  } catch {
    return DEFAULT_SHIPPING_INFO;
  }
}

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found — underdawg' };
  return {
    title: `${product.title} — underdawg`,
    description: product.description?.slice(0, 160) || product.title,
  };
}

export default async function ProductPage({ params }) {
  const slug = (await params).slug;
  const [product, shippingLines] = await Promise.all([getProduct(slug), getShippingInfo()]);
  if (!product) notFound();

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const pct = onSale ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const totalStock = (product.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
  const related = product.relatedProducts || [];

  return (
    <>
      <Header />
      <CartDrawer />

      <div className="pdp">
        {/* Gallery */}
        <div className="pdp-gallery">
          {(product.images || []).slice(0, 8).map((src, i) => (
            <img key={i} src={resolveImage(src, 1080)} alt={`${product.title} view ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
          ))}
        </div>

        {/* Info panel */}
        <aside className="pdp-info">
          {/* Show the product's COLLECTION here, not its raw category enum.
              Falls back to category only if it isn't in any collection yet. */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            {product.collections?.[0]?.title || product.category}
          </div>
          <h1 className="pdp-title">{product.title}</h1>

          <div className="pdp-price">
            {onSale && <span className="strike">£{product.compareAtPrice.toLocaleString('en-GB')}</span>}
            <span style={{ fontWeight: 600 }}>£{product.price.toLocaleString('en-GB')}</span>
            {onSale && <span className="badge red" style={{ marginLeft: 6 }}>-{pct}%</span>}
          </div>

          {/* Stock indicator */}
          {totalStock > 0 && totalStock <= 5 && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.12em', color: '#e07000', marginBottom: 12 }}>
              Only {totalStock} left
            </p>
          )}

          <ProductActions product={product} />

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {product.tags.map((t) => (
                <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid var(--line)', borderRadius: 2 }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                Description
              </div>
              <p className="pdp-desc" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
            </div>
          )}

          {/* Colours are chosen in <ProductActions> above, next to size —
              a read-only list here would just duplicate that selector. */}

          {/* Shipping & returns */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 13, lineHeight: 2, color: 'var(--ink-soft)' }}>
            {shippingLines.map((line, i) => (
              <div key={i}>✓ {line}</div>
            ))}
          </div>
        </aside>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="section" style={{ borderTop: '1px solid var(--line)', marginTop: 0 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 12 }}>
            — You may also like
          </p>
          <h2 className="section-title" style={{ marginBottom: 32 }}>Related</h2>
          <div className="products-grid">
            {related.slice(0, 8).map((p) => {
              const img = resolveImage(p.images?.[0], 600);
              const hasSale = p.compareAtPrice && p.compareAtPrice > p.price;
              return (
                <Link key={p._id} href={`/product/${p.slug}`} className="product-card">
                  <div className="product-card-img">
                    {img && <img src={img} alt={p.title} loading="lazy" />}
                    {p.isNew && <span className="product-badge">New</span>}
                  </div>
                  <div className="product-card-info">
                    <p className="product-card-title">{p.title}</p>
                    <div className="product-card-price">
                      <span>£{p.price.toLocaleString()}</span>
                      {hasSale && <span className="product-card-compare">£{p.compareAtPrice.toLocaleString()}</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
