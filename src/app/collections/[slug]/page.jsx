import { api } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { notFound } from 'next/navigation';

export const revalidate = 60;

async function getData(slug) {
  try {
    return await api.collections.get(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const data = await getData(params.slug);
  if (!data) return { title: 'Collection not found — NORTHVERSE' };
  return { title: `${data.collection.title} — NORTHVERSE` };
}

export default async function CollectionPage({ params }) {
  const data = await getData(params.slug);
  if (!data) notFound();

  const { collection, products } = data;

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <section className="col-hero">
        <img src={collection.desktopImage || `https://picsum.photos/seed/${collection.slug}/1920/900`} alt="" />
        <div className="col-hero-body">
          {collection.eyebrow && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 12 }}>
              — {collection.eyebrow}
            </span>
          )}
          <h1>{collection.title}</h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        {collection.description && (
          <p style={{ maxWidth: 640, margin: '0 0 40px', color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.7 }}>
            {collection.description}
          </p>
        )}

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <p>No products in this collection yet.</p>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
