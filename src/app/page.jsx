import { api } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import StoriesStrip from '@/components/StoriesStrip';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import DiscoverSwiper from '@/components/DiscoverSwiper';
import Marquee from '@/components/Marquee';
import Stores from '@/components/Stores';
import Footer from '@/components/Footer';
import Link from 'next/link';

async function getData() {
  try {
    const [latest, caps, winter, collectionsData, settings] = await Promise.all([
      api.products.list({ isNew: 'true', limit: 4 }),
      api.products.list({ category: 'caps', limit: 5 }),
      api.products.list({ featured: 'true', limit: 8 }),
      api.collections.list({ featured: 'true' }),
      api.settings.get(),
    ]);
    return {
      latest: latest.items || [],
      caps: caps.items || [],
      winter: winter.items || [],
      collections: collectionsData.items || [],
      settings,
    };
  } catch (err) {
    console.error('[home] data fetch failed:', err.message);
    return { latest: [], caps: [], winter: [], collections: [], settings: null };
  }
}

export const revalidate = 60; // ISR

export default async function HomePage() {
  const { latest, caps, winter, collections, settings } = await getData();

  const hero    = settings?.hero    || {};
  const stories = settings?.stories?.length ? settings.stories : null;
  const stores  = settings?.stores?.length  ? settings.stores  : null;

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <StoriesStrip stories={stories || undefined} />
      <Hero
        desktop={hero.desktop   || undefined}
        mobile={hero.mobile     || undefined}
        eyebrow={hero.eyebrow   || undefined}
        title={hero.title       || undefined}
        cta={hero.ctaLabel ? { label: hero.ctaLabel, href: hero.ctaHref || '/collections' } : undefined}
      />

      {/* Latest drop */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="section-subtitle">— 01 / Latest Drop</span>
            <h2 className="section-title">New this week</h2>
          </div>
          <Link href="/collections" className="link-arrow">Discover more →</Link>
        </div>
        {latest.length > 0 ? (
          <div className="product-grid">
            {latest.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        ) : (
          <div className="empty-state">
            <p>No products yet. Run the backend seed script or add products via the admin panel.</p>
          </div>
        )}
      </section>

      {/* Caps rail */}
      {caps.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <span className="section-subtitle">— 02 / Accessories</span>
              <h2 className="section-title">Caps</h2>
            </div>
            <Link href="/collections/caps" className="link-arrow">Discover more →</Link>
          </div>
          <div className="rail">
            {caps.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Discover Collection swiper */}
      {collections.length > 0 && (
        <section>
          <div className="section-head" style={{ padding: '0 var(--pad)', marginBottom: 20 }}>
            <div>
              <span className="section-subtitle">— 03 / Collections</span>
              <h2 className="section-title">Discover</h2>
            </div>
          </div>
          <DiscoverSwiper items={collections} />
        </section>
      )}

      <Marquee />

      {/* Featured products */}
      {winter.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="section-subtitle">— 04 / Icons</span>
              <h2 className="section-title">Winter icons</h2>
            </div>
            <Link href="/collections/winter-25" className="link-arrow">View all →</Link>
          </div>
          <div className="product-grid">
            {winter.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      <Stores stores={stores || undefined} />
      <Footer />
    </>
  );
}
