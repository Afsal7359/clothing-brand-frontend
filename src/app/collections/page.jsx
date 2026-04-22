import Link from 'next/link';
import { api } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

export const revalidate = 60;

async function getData() {
  try {
    const [cols, products] = await Promise.all([
      api.collections.list({ active: 'true' }),
      api.products.list({ limit: 48 }),
    ]);
    return { collections: cols.items || [], products: products.items || [] };
  } catch {
    return { collections: [], products: [] };
  }
}

export default async function CollectionsIndex() {
  const { collections, products } = await getData();

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <section className="section">
        <div className="section-head">
          <div>
            <span className="section-subtitle">— All Collections</span>
            <h1 className="section-title">Shop</h1>
          </div>
        </div>

        {collections.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 4, marginBottom: 56 }}>
            {collections.map((c, i) => (
              <Link key={c._id} href={`/collections/${c.slug}`} className="discover-card" style={{ aspectRatio: '4/5' }}>
                <img src={c.desktopImage || `https://picsum.photos/seed/col${i}/800/1000`} alt={c.title} />
                <div className="discover-card-body">
                  {c.eyebrow && <span className="eyebrow">— {c.eyebrow}</span>}
                  <h3>{c.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="section-head">
          <div>
            <span className="section-subtitle">— All Products</span>
            <h2 className="section-title">{products.length} items</h2>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <p>No products available. Add them via the admin panel.</p>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
