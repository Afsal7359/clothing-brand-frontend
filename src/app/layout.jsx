import { Archivo, Archivo_Black, JetBrains_Mono } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { UserProvider } from '@/context/UserContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import BottomNav from '@/components/BottomNav';
import CartToast from '@/components/CartToast';
import LoadingScreen from '@/components/LoadingScreen';
import ScrollToTop from '@/components/ScrollToTop';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
});

const archivoBlack = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'underdawg — Premium Streetwear',
  description: 'Gender-neutral premium streetwear. London, UK.',
};

// MUST be its own export in Next 14+ — a `viewport` key inside `metadata` is
// ignored, so no <meta name="viewport"> was emitted at all. Without it mobile
// browsers assume a ~980px layout viewport and scale the page down, which means
// no CSS media query ever matches and the site looks like shrunken desktop.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${archivoBlack.variable} ${mono.variable}`}>
      <body>
        <AnalyticsProvider>
          <UserProvider>
            <CartProvider>
              <ScrollToTop />
              <LoadingScreen />
              {children}
              <BottomNav />
              <CartToast />
            </CartProvider>
          </UserProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
