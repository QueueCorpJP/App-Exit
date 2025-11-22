import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import { getCachedMessages } from '@/lib/cache-utils';

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "optional", // CLSを防ぐためoptionalに変更（100ms以内に読み込まれなければシステムフォント使用）
  preload: true, // フォントをプリロード
  adjustFontFallback: true, // フォールバックフォントのサイズを調整してCLSを最小化
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  // ⚡ キャッシュ化されたgetMessagesを使用（重複呼び出しを防ぐ）
  const messages = await getCachedMessages();
  const metadata = (messages as any).metadata || {};

  return {
    metadataBase: new URL('https://appexit.jp'),
    title: {
      default: metadata.title || 'APPEXIT',
      template: '%s | APPEXIT'
    },
    description: metadata.description || '',
    keywords: metadata.keywords || [],
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
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      url: 'https://appexit.jp',
      siteName: 'APPEXIT',
      title: metadata.ogTitle || 'APPEXIT',
      description: metadata.ogDescription || '',
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
      title: metadata.twitterTitle || 'APPEXIT',
      description: metadata.twitterDescription || '',
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
      icon: '/logo.png',
      shortcut: '/logo.png',
      apple: '/logo.png',
    },
    manifest: '/manifest.json',
    verification: {
      google: 'google-site-verification-code',
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // ⚡ キャッシュ化されたgetMessagesを使用（generateMetadataと共有）
  const messages = await getCachedMessages();

  return (
    <html lang={locale} prefix="og: http://ogp.me/ns#">
      <head>
        {/* ⚡ 構造化データはトップページ(page.tsx)に移動してHTMLサイズ削減 */}
      </head>
      <body className={`${notoSansJP.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F7' }}>
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer locale={locale} />
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
