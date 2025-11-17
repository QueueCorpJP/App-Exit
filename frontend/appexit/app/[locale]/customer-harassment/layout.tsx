import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'カスタマーハラスメントに対する考え方 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITのカスタマーハラスメントに対する基本方針。お客様とスタッフが互いに尊重し合える健全な取引環境の維持に努めています。不当な要求や業務妨害には毅然と対応いたします。',
  keywords: ['APPEXIT', 'カスタマーハラスメント', 'ハラスメント対策', '健全な取引環境', '業務妨害', '安全対策'],
  openGraph: {
    title: 'カスタマーハラスメントに対する考え方 | APPEXIT',
    description: 'お客様とスタッフが互いに尊重し合える健全な取引環境の維持',
    url: 'https://appexit.jp/customer-harassment',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'カスタマーハラスメントに対する考え方 | APPEXIT',
    description: 'お客様とスタッフが互いに尊重し合える健全な取引環境の維持',
  },
  alternates: {
    canonical: 'https://appexit.jp/customer-harassment',
  },
}

export default function CustomerHarassmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

