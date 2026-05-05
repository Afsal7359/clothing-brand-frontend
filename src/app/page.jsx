import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import DiscoverSwiper from '@/components/DiscoverSwiper';
import Marquee from '@/components/Marquee';
import Stores from '@/components/Stores';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function fetchJSON(url) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getData() {
  const [latest, collectionsData, settings] = await Promise.all([
    fetchJSON(`${API_URL}/products?isNew=true&limit=8&status=active`),
    fetchJSON(`${API_URL}/collections?featured=true`),
    fetchJSON(`${API_URL}/settings`),
  ]);

  const collections = collectionsData?.items || [];

  // For each featured collection fetch up to 8 products
  const collectionRails = await Promise.all(
    collections.slice(0, 3).map(async (col) => {
      const data = await fetchJSON(
        `${API_URL}/products?collectionSlug=${col.slug}&page=1&limit=8&status=active`
      );
      return { collection: col, products: data?.items || [] };
    })
  );

  return {
    latest: latest?.items || [],
    collectionRails: collectionRails.filter((r) => r.products.length > 0),
    allCollections: collections,
    settings: settings || null,
  };
}

export default async function HomePage() {
  const { latest, collectionRails, allCollections, settings } = await getData();

  const hero   = settings?.hero    || {};
  const stores = settings?.stores?.length ? settings.stores : null;

  return (
    <>
      <Header />
      <CartDrawer />

      <div data-section="hero">
        <Hero
          desktop={hero.desktop  || undefined}
          mobile={hero.mobile    || undefined}
          eyebrow={hero.eyebrow  || undefined}
          title={hero.title      || undefined}
          cta={hero.ctaLabel ? { label: hero.ctaLabel, href: hero.ctaHref || '/collections' } : undefined}
        />
      </div>

      {/* Latest drop */}
      {latest.length > 0 && (
        <section className="section" data-section="new-in">
          <div className="section-head">
            <div>
              <span className="section-subtitle">— New in</span>
              <h2 className="section-title">Latest drop</h2>
            </div>
            <Link href="/collections/all" className="link-arrow">Discover more →</Link>
          </div>
          <div className="product-grid">
            {latest.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Dynamic collection rails from DB */}
      {collectionRails.map((rail, i) => (
        <section key={rail.collection._id} className="section" style={{ paddingTop: 0 }} data-section="collections">
          <div className="section-head">
            <div>
              <span className="section-subtitle">— {rail.collection.eyebrow || `0${i + 2} / Collection`}</span>
              <h2 className="section-title">{rail.collection.title}</h2>
            </div>
            <Link href={`/collections/${rail.collection.slug}`} className="link-arrow">
              View all →
            </Link>
          </div>
          <div className={rail.products.length <= 5 ? 'rail' : 'product-grid'}>
            {rail.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      ))}

      {/* Discover swiper */}
      {allCollections.length > 0 && (
        <section data-section="discover">
          <div className="section-head" style={{ padding: '0 var(--pad)', marginBottom: 20 }}>
            <div>
              <span className="section-subtitle">— Collections</span>
              <h2 className="section-title">Discover</h2>
            </div>
          </div>
          <DiscoverSwiper items={allCollections} />
        </section>
      )}

      <div data-section="marquee"><Marquee /></div>

      <div data-section="stores"><Stores stores={stores || undefined} /></div>
      <Footer />
    </>
  );
}
