import type { Metadata, Viewport } from 'next';
import './globals.css';
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
    <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('dhaiqati-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
