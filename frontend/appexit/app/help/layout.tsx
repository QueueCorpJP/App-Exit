import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ヘルプ | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description:
    'APPEXITの使い方、トラブルシュート、よくある質問、各種ポリシーへの導線をまとめたヘルプページです。',
  keywords: ['APPEXIT', 'ヘルプ', '使い方', 'サポート', 'FAQ', 'お問い合わせ'],
  openGraph: {
    title: 'ヘルプ | APPEXIT',
    description:
      '使い方や困ったときはこちら。よくある質問・お問い合わせ・各種ポリシーへの導線をまとめています。',
    url: 'https://appexit.jp/help',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ヘルプ | APPEXIT',
    description:
      '使い方や困ったときはこちら。よくある質問・お問い合わせ・各種ポリシーへの導線をまとめています。',
  },
  alternates: {
    canonical: 'https://appexit.jp/help',
  },
}

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


