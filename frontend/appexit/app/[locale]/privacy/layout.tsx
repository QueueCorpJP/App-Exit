import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITのプライバシーポリシー。個人情報の取り扱い、収集する情報、利用目的、第三者提供、セキュリティ対策について定めています。お客様の情報を適切に管理・保護いたします。',
  keywords: ['APPEXIT', 'プライバシーポリシー', 'Privacy Policy', '個人情報保護', '情報セキュリティ', 'データ保護'],
  openGraph: {
    title: 'プライバシーポリシー | APPEXIT',
    description: 'APPEXITのプライバシーポリシー。個人情報の適切な管理・保護について',
    url: 'https://appexit.jp/privacy',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'プライバシーポリシー | APPEXIT',
    description: 'APPEXITのプライバシーポリシー。個人情報の適切な管理・保護について',
  },
  alternates: {
    canonical: 'https://appexit.jp/privacy',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

