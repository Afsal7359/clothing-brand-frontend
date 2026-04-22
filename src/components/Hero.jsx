import Link from 'next/link';

export default function Hero({
  desktop = 'https://picsum.photos/seed/herodesk/1920/1080',
  mobile = 'https://picsum.photos/seed/heromob/900/1200',
  eyebrow = 'SS26 — Drop 01',
  title = 'Built For The Street',
  cta = { label: 'Shop the collection', href: '/collections' },
}) {
  return (
    <section className="hero" aria-label="Current campaign">
      <img className="hero-img desktop" src={desktop} alt="" />
      <img className="hero-img mobile" src={mobile} alt="" />
      <div className="hero-content">
        <span className="hero-eyebrow">{eyebrow}</span>
        <h1 className="hero-title">{title}</h1>
        <Link href={cta.href} className="btn">
          {cta.label}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
