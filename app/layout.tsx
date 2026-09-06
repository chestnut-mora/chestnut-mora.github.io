import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://chestnut-mora.github.io'),
  title: '栗子森林 Chestnut Mora｜正版泡泡瑪特 POP MART 手作萌粒手機鍊',
  description:
    '栗子森林 Chestnut Mora，以台灣原創設計理念進行手作搭配，將泡泡瑪特（POP MART）正版 IP 角色與串珠、配件組合成獨特的萌粒（POP BEAN）手機鍊與手機吊飾；在栗子森林，我們稱這些陪伴日常的小收藏為「萌栗」。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/assets/brand/logo-brown.png',
  },
  openGraph: {
    title: '栗子森林 Chestnut Mora｜台灣手作｜泡泡瑪特 POP MART 萌粒手機鍊',
    description: '正版角色 × 手作搭配，把喜歡的小角色做成可以掛在手機與包包上的萌栗手機鍊，每一條都獨一無二。',
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
    title: '栗子森林 Chestnut Mora｜台灣手作｜泡泡瑪特 POP MART 萌粒手機鍊',
    description: '正版角色 × 手作搭配，把喜歡的小角色做成可以掛在手機與包包上的萌栗手機鍊，每一條都獨一無二。',
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
