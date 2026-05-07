import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <CartDrawer />
      <section className="section" style={{ textAlign: 'center', minHeight: '50vh' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
          Error 404
        </div>
        <h1 className="section-title" style={{ marginBottom: 20 }}>Page not found</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="btn btn-dark">Back to homepage</Link>
      </section>
      <Footer />
    </>
  );
}
