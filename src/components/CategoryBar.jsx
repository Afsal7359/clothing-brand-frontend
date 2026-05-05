import CategoryCirclesClient from './CategoryCirclesClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

async function getCollections() {
  try {
    const res = await fetch(`${API_URL}/collections`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function CategoryBar({ activeSlug = '' }) {
  const collections = await getCollections();
  return (
    <div className="category-bar">
      <CategoryCirclesClient collections={collections} activeSlug={activeSlug} />
    </div>
  );
}
