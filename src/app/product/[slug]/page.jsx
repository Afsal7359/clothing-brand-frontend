import { api, resolveImage } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductActions from './ProductActions';
import Link from 'next/link';
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
  const slug = (await params).slug;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product not found — underdwag' };
  return {
    title: `${product.title} — underdwag`,
    description: product.description?.slice(0, 160) || product.title,
  };
}

export default async function ProductPage({ params }) {
  const slug = (await params).slug;
  const product = await getProduct(slug);
  if (!product) notFound();

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const pct = onSale ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
  const totalStock = (product.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
  const related = product.relatedProducts || [];

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <div className="pdp">
        {/* Gallery */}
        <div className="pdp-gallery">
          {(product.images || []).slice(0, 8).map((src, i) => (
            <img key={i} src={resolveImage(src)} alt={`${product.title} view ${i + 1}`} loading={i < 2 ? 'eager' : 'lazy'} />
          ))}
        </div>

        {/* Info panel */}
        <aside className="pdp-info">
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
            {product.category}
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

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                Available colours
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {product.colors.map((c) => (
                  <span key={c} style={{ fontSize: 12, color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 2, padding: '3px 10px' }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Shipping & returns */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)', fontSize: 13, lineHeight: 2, color: 'var(--ink-soft)' }}>
            <div>✓ Free shipping on orders above £2,500</div>
            <div>✓ 7-day easy returns &amp; exchanges</div>
            <div>✓ Cash on delivery available</div>
            <div>✓ Secure payments with Stripe</div>
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
              const img = resolveImage(p.images?.[0]);
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
