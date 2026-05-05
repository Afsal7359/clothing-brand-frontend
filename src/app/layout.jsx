import { Archivo, Archivo_Black, JetBrains_Mono } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { UserProvider } from '@/context/UserContext';
import { AnalyticsProvider } from '@/context/AnalyticsContext';
import BottomNav from '@/components/BottomNav';
import CartToast from '@/components/CartToast';
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
  title: 'underdwag — Premium Streetwear',
  description: 'Gender-neutral premium streetwear built in India.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    viewportFit: 'cover',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivo.variable} ${archivoBlack.variable} ${mono.variable}`}>
      <body>
        <AnalyticsProvider>
          <UserProvider>
            <CartProvider>
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
