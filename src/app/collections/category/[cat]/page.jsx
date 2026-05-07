import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import InfiniteProductGrid from '@/components/InfiniteProductGrid';
import CategoryBar from '@/components/CategoryBar';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function getCategoryProducts(cat) {
  try {
    const res = await fetch(
      `${API_URL}/products?category=${cat}&page=1&limit=20&status=active`,
      { next: { revalidate: 60 } }
    );
    return res.json();
  } catch {
    return { items: [], total: 0 };
  }
}

export async function generateMetadata({ params }) {
  const cat = (await params).cat;
  return { title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} — underdwag` };
}

export default async function CategoryPage({ params }) {
  const cat = (await params).cat;
  const data = await getCategoryProducts(cat);
  const label = cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <>
      <Header />
      <CartDrawer />

      <CategoryBar activeSlug="" />

      <section className="section" style={{ paddingTop: 28 }}>
        <div className="cat-page-header">
          <h1 className="cat-page-title">{label}</h1>
          <span className="cat-page-count">{data.total || 0} products</span>
        </div>

        <InfiniteProductGrid
          category={cat}
          collectionSlug={null}
          initialItems={data.items || []}
          initialTotal={data.total || 0}
        />
      </section>

      <Footer />
    </>
  );
}
