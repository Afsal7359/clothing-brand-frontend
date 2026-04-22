export default function Marquee({ items = ['Free Shipping', 'New Drop', 'Made In India', 'Premium Streetwear', 'Unisex Fits'] }) {
  const doubled = [...items, ...items];
  return (
    <div className="strip" aria-hidden="true">
      <div className="strip-track">
        {doubled.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}
