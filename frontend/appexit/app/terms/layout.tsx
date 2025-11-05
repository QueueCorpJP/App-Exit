import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの利用規約。アプリ・Webサービスの売買プラットフォームを安全・安心にご利用いただくための規約です。登録、出品、購入、取引に関するルールや禁止事項を定めています。',
  keywords: ['APPEXIT', '利用規約', 'Terms of Service', 'アプリ売買規約', '取引規約', 'プラットフォーム規約'],
  openGraph: {
    title: '利用規約 | APPEXIT',
    description: 'APPEXITの利用規約。安全・安心な取引のためのルールと禁止事項',
    url: 'https://appexit.jp/terms',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '利用規約 | APPEXIT',
    description: 'APPEXITの利用規約。安全・安心な取引のためのルールと禁止事項',
  },
  alternates: {
    canonical: 'https://appexit.jp/terms',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

