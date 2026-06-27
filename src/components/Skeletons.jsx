import Header from './Header';

/* Grey shimmer placeholders shown during page navigation (loading.jsx). */

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <>
      <Header />
      <div className="section">
        <div className="product-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div className="sk-product" key={i}>
              <div className="skeleton sk-media" />
              <div className="skeleton sk-line" />
              <div className="skeleton sk-line short" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function GenericSkeleton() {
  return (
    <>
      <Header />
      <div className="section" style={{ minHeight: '60vh' }}>
        <div className="skeleton sk-line" style={{ width: '30%', height: 14 }} />
        <div className="skeleton sk-line" style={{ width: '55%', height: 30, marginTop: 14, marginBottom: 26 }} />
        <div className="product-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="sk-product" key={i}>
              <div className="skeleton sk-media" />
              <div className="skeleton sk-line" />
              <div className="skeleton sk-line short" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ProductDetailSkeleton() {
  return (
    <>
      <Header />
      <div className="pdp">
        <div className="pdp-gallery">
          <div className="skeleton" style={{ aspectRatio: '3 / 4' }} />
          <div className="skeleton" style={{ aspectRatio: '3 / 4' }} />
        </div>
        <aside className="pdp-info">
          <div className="skeleton sk-line" style={{ width: '35%' }} />
          <div className="skeleton sk-line" style={{ width: '75%', height: 26, marginTop: 14 }} />
          <div className="skeleton sk-line" style={{ width: '25%', height: 18, marginTop: 16 }} />
          <div className="skeleton" style={{ height: 46, marginTop: 26, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 46, marginTop: 12, borderRadius: 4 }} />
        </aside>
      </div>
    </>
  );
}
