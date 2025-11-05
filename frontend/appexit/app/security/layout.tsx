import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '情報セキュリティ基本方針 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの情報セキュリティ基本方針。情報資産の機密性・完全性・可用性を確保し、お客様の情報を適切に保護します。技術的・物理的・人的セキュリティ対策を実施しています。',
  keywords: ['APPEXIT', '情報セキュリティ', 'セキュリティポリシー', '情報保護', 'サイバーセキュリティ', 'データ保護'],
  openGraph: {
    title: '情報セキュリティ基本方針 | APPEXIT',
    description: '情報資産の機密性・完全性・可用性を確保し、お客様の情報を適切に保護',
    url: 'https://appexit.jp/security',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '情報セキュリティ基本方針 | APPEXIT',
    description: '情報資産の機密性・完全性・可用性を確保し、お客様の情報を適切に保護',
  },
  alternates: {
    canonical: 'https://appexit.jp/security',
  },
}

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

