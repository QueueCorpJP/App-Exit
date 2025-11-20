import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '秘密保持契約（NDA） | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの秘密保持契約（NDA）。秘密情報の取り扱い、開示者と受領者の義務、有効期間、損害賠償について定めています。安全な情報共有のための契約です。',
  keywords: ['APPEXIT', 'NDA', '秘密保持契約', 'Non-Disclosure Agreement', '機密保持', '情報管理', '契約'],
  openGraph: {
    title: '秘密保持契約（NDA） | APPEXIT',
    description: 'APPEXITの秘密保持契約（NDA）。安全な情報共有のための契約',
    url: 'https://appexit.jp/nda',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '秘密保持契約（NDA） | APPEXIT',
    description: 'APPEXITの秘密保持契約（NDA）。安全な情報共有のための契約',
  },
  alternates: {
    canonical: 'https://appexit.jp/nda',
  },
}

export default function NDALayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

