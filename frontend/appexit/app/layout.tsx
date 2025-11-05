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
              alternateName: ['App Exit', 'アプリ・Webサービス売買プラットフォーム', 'アプリエグジット'],
              url: 'https://appexit.jp',
              description: '個人や小規模チームが作ったアプリを、次の運営者に売れる場所。アプリやWebサービスを安全に売買できる日本最大級のマーケットプレイス。',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: 'APPEXITマーケットプレイス',
              description: '個人や小規模チームが作ったアプリ・Webサービスを次の運営者に売れる場所。FlippaやAcquire.comに近い仕組みで、日本市場に特化したアプリ売買マーケットプレイス。',
              category: 'アプリ売買マーケットプレイス',
              brand: {
                '@type': 'Brand',
                name: 'APPEXIT'
              },
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'JPY',
                lowPrice: '10000',
                highPrice: '100000000',
                offerCount: '100',
                availability: 'https://schema.org/InStock'
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                reviewCount: '150'
              },
              audience: {
                '@type': 'Audience',
                audienceType: '個人開発者、スタートアップ、中小企業'
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              serviceType: 'アプリ・Webサービス売買仲介サービス',
              name: 'APPEXIT',
              description: '個人開発者がアプリをエグジット（売却で収益化）できる仕組みを提供。小さなアプリやSaaSを"資産"として流通させる市場。FlippaやAcquire.comにはないAI技術（AI価格査定・AIマッチング・AI審査）で圧倒的差別化。専任担当サポート、エスクロー決済で安心・安全な取引を実現。グローバル展開準備中。',
              provider: {
                '@type': 'Organization',
                name: 'Queue株式会社',
                url: 'https://appexit.jp'
              },
              areaServed: {
                '@type': 'Country',
                name: 'Japan'
              },
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: '取扱サービス',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'アプリ・Webサービスの売却サポート',
                      description: 'AI価格査定（精度90%以上）、AIマッチング（成功率3倍）、AI審査（不正検出95%以上）、出品資料作成、契約書作成、引き継ぎまで一貫サポート。FlippaやAcquire.comにはないAI技術で差別化。手数料：成約時10%'
                    }
                  },
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Service',
                      name: 'アプリ・Webサービスの購入サポート',
                      description: 'AIマッチングで最適案件紹介、AI審査で不正案件回避、デューデリジェンス支援、価格交渉、契約・決済、引き継ぎ・運用サポート。FlippaやAcquire.comにはないAI技術で安心。手数料：成約時5%'
                    }
                  }
                ]
              },
              category: [
                'アプリM&A',
                'Webサービス売買',
                'SaaS売買',
                'マーケットプレイス',
                'エグジット支援'
              ]
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
