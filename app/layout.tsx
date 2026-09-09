import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Arabic } from 'next/font/google';
import './globals.css';
const arabic = Noto_Sans_Arabic({
  variable: '--font-arabic',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});
export const metadata: Metadata = {
  title: 'ذائقتي | دفتر المطاعم',
  description: 'أماكن زرتها، وأطباق أحببتها. دفتر خاص لذكرياتك مع المطاعم.',
  applicationName: 'ذائقتي',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ذائقتي',
  },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c0f0d',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={arabic.variable}>{children}</body>
    </html>
  );
}
