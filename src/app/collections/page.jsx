import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import InfiniteProductGrid from '@/components/InfiniteProductGrid';
import CategoryBar from '@/components/CategoryBar';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function getData() {
  try {
    const res = await fetch(`${API_URL}/products?page=1&limit=20&status=active`, { next: { revalidate: 60 } });
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function CollectionsIndex() {
  const data = await getData();

  return (
    <>
      <Header />
      <CartDrawer />

      <CategoryBar activeSlug="all" />

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="cat-page-header">
          <h1 className="cat-page-title">All Products</h1>
          <span className="cat-page-count">{data.total || 0} products</span>
        </div>

        <InfiniteProductGrid
          collectionSlug={null}
          category={null}
          initialItems={data.items || []}
          initialTotal={data.total || 0}
        />
      </section>

      <Footer />
    </>
  );
}
