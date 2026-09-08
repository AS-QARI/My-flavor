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
  title: 'مذاق | دفتر تجاربي',
  description: 'أماكن زرتها، وأطباق أحببتها. دفتر خاص لذكرياتك مع المطاعم.',
  applicationName: 'مذاق',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'مذاق' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8f5ef',
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
