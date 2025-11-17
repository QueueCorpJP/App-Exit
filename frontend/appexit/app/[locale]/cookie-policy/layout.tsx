import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'クッキーポリシー | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITのクッキーポリシー。当サイトで使用するクッキーの種類、目的、管理方法について説明しています。サービス改善とユーザー体験向上のためにクッキーを使用しています。',
  keywords: ['APPEXIT', 'クッキーポリシー', 'Cookie Policy', 'クッキー', 'Cookie', 'トラッキング', 'プライバシー'],
  openGraph: {
    title: 'クッキーポリシー | APPEXIT',
    description: 'APPEXITで使用するクッキーの種類、目的、管理方法について',
    url: 'https://appexit.jp/cookie-policy',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'クッキーポリシー | APPEXIT',
    description: 'APPEXITで使用するクッキーの種類、目的、管理方法について',
  },
  alternates: {
    canonical: 'https://appexit.jp/cookie-policy',
  },
}

export default function CookiePolicyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

