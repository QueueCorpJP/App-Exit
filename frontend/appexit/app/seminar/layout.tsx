import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '説明会・相談会 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの無料説明会・個別相談会のご案内。アプリ・Webサービスの売買について専門スタッフが丁寧にご説明します。オンライン対応可能。売却価格の査定、出品方法、取引の流れなど、お気軽にご相談ください。',
  keywords: ['APPEXIT', '説明会', '相談会', 'アプリ売買説明会', 'M&A相談', '無料相談', 'オンライン説明会', '個別相談', '売却相談'],
  openGraph: {
    title: '説明会・相談会 | APPEXIT',
    description: 'アプリ・Webサービスの売買について専門スタッフが丁寧にご説明。無料説明会・個別相談会開催中',
    url: 'https://appexit.jp/seminar',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '説明会・相談会 | APPEXIT',
    description: 'アプリ・Webサービスの売買について専門スタッフが丁寧にご説明。無料説明会・個別相談会開催中',
  },
  alternates: {
    canonical: 'https://appexit.jp/seminar',
  },
}

export default function SeminarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

