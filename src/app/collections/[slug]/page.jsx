import { api } from '@/lib/api';
import AnnounceBar from '@/components/AnnounceBar';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import InfiniteProductGrid from '@/components/InfiniteProductGrid';
import CategoryBar from '@/components/CategoryBar';
import { notFound } from 'next/navigation';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function getPageData(slug) {
  if (slug === 'all') {
    const data = await fetch(
      `${API_URL}/products?page=1&limit=20&status=active`,
      { next: { revalidate: 60 } }
    ).then((r) => r.json()).catch(() => ({ items: [], total: 0 }));
    return { kind: 'all', title: 'All Products', items: data.items || [], total: data.total || 0 };
  }

  try {
    const [colData, prodsData] = await Promise.all([
      api.collections.get(slug),
      fetch(`${API_URL}/products?collectionSlug=${slug}&page=1&limit=20&status=active`, { next: { revalidate: 60 } })
        .then((r) => r.json()).catch(() => ({ items: [], total: 0 })),
    ]);
    return {
      kind: 'collection',
      collection: colData.collection,
      items: prodsData.items || [],
      total: prodsData.total || 0,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  if (slug === 'all') return { title: 'All Products — underdwag' };
  try {
    const data = await api.collections.get(slug);
    return { title: `${data.collection.title} — underdwag` };
  } catch {
    return { title: 'Collection — underdwag' };
  }
}

export default async function CollectionPage({ params }) {
  const slug = (await params).slug;
  const data = await getPageData(slug);
  if (!data) notFound();

  const title = data.kind === 'all' ? 'All Products' : data.collection.title;
  const description = data.kind === 'collection' ? data.collection.description : '';

  return (
    <>
      <AnnounceBar />
      <Header />
      <CartDrawer />

      <CategoryBar activeSlug={slug} />

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="cat-page-header">
          <h1 className="cat-page-title">{title}</h1>
          <span className="cat-page-count">{data.total} products</span>
        </div>

        {description && <p className="cat-page-desc">{description}</p>}

        <InfiniteProductGrid
          collectionSlug={data.kind === 'collection' ? slug : null}
          category={null}
          initialItems={data.items}
          initialTotal={data.total}
        />
      </section>

      <Footer />
    </>
  );
}
