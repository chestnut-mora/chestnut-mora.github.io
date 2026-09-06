import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chestnut-mora.github.io'),
  title: '栗子森林 Chestnut Mora｜正版角色手作萌栗手機鍊',
  description:
    '栗子森林 Chestnut Mora，以正版角色搭配串珠與配件，手工製作一條條獨特萌栗，把喜歡的小角色掛進每天的日常。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/assets/brand/logo-brown.png',
  },
  openGraph: {
    title: '栗子森林 Chestnut Mora',
    description: '把喜歡的小角色，掛進每天的日常。',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/assets/hero/hero-forest.png',
        width: 1080,
        height: 1350,
        alt: '陽光下的草編袋與暖色系萌栗手機鍊',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '栗子森林 Chestnut Mora',
    description: '把喜歡的小角色，掛進每天的日常。',
    images: ['/assets/hero/hero-forest.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-Q1MERLHQGR" strategy="beforeInteractive" />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Q1MERLHQGR');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
