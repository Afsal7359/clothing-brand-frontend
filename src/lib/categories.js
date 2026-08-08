// Shared category data — no 'use client', safe to import in server and client components
//
// No image URLs here. Tiles are illustrated with a real product shot from that
// category (passed in as `images` by CategoryBar); a category with no products
// yet shows a neutral grey tile rather than a stock photo.

export const CATEGORIES = [
  { label: 'All',         slug: 'all',         image: '' },  // shows gradient ring only
  { label: 'T-Shirts',    slug: 'tshirts',     image: '' },
  { label: 'Hoodies',     slug: 'hoodies',     image: '' },
  { label: 'Jackets',     slug: 'jackets',     image: '' },
  { label: 'Shirts',      slug: 'shirts',      image: '' },
  { label: 'Sweatshirts', slug: 'sweatshirts', image: '' },
  { label: 'Polos',       slug: 'polos',       image: '' },
  { label: 'Pants',       slug: 'pants',       image: '' },
  { label: 'Shorts',      slug: 'shorts',      image: '' },
  { label: 'Caps',        slug: 'caps',        image: '' },
  { label: 'Bags',        slug: 'bags',        image: '' },
];
