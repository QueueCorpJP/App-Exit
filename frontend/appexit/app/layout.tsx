import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://appexit.jp'),
  title: {
    default: 'APPEXIT - アプリ・Webサービス売買プラットフォーム | 安心・安全なM&A',
    template: '%s | APPEXIT'
  },
  description: 'APPEXITは、アプリやWebサービスを安全に売買できる日本最大級のプラットフォームです。専任担当によるサポート、適正価格での取引、充実したセキュリティで、あなたのM&Aを成功へと導きます。',
  keywords: ['APPEXIT', 'アプリ売買', 'Webサービス売買', 'アプリM&A', 'サービスM&A', 'スタートアップ', 'Exit', 'アプリ売却', 'サービス買収', 'マーケットプレイス'],
  authors: [{ name: 'Queue株式会社', url: 'https://appexit.jp' }],
  creator: 'Queue株式会社',
  publisher: 'Queue株式会社',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://appexit.jp',
    siteName: 'APPEXIT',
    title: 'APPEXIT - アプリ・Webサービス売買プラットフォーム',
    description: 'アプリやWebサービスを安全に売買できる日本最大級のプラットフォーム',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'APPEXIT',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@appexitjp',
    creator: '@appexitjp',
    title: 'APPEXIT - アプリ・Webサービス売買プラットフォーム',
    description: 'アプリやWebサービスを安全に売買できる日本最大級のプラットフォーム',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'google-site-verification-code', // 実際のコードに置き換える
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" prefix="og: http://ogp.me/ns#">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'APPEXIT',
              alternateName: 'アプリ・Webサービス売買プラットフォーム',
              url: 'https://appexit.jp',
              description: 'アプリやWebサービスを安全に売買できる日本最大級のプラットフォーム',
              publisher: {
                '@type': 'Organization',
                name: 'Queue株式会社',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://appexit.jp/logo.png'
                },
                url: 'https://appexit.jp',
                sameAs: [
                  'https://twitter.com/appexitjp',
                  'https://www.facebook.com/appexitjp',
                  'https://www.instagram.com/appexitjp'
                ]
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://appexit.jp/search?q={search_term_string}'
                },
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      </head>
      <body
        className={`${notoSansJP.variable} antialiased`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F7' }}>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
