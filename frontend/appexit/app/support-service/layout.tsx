import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'サポートサービス | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの充実したサポートサービス。専任担当制で出品から成約、引き継ぎまで一貫サポート。価格査定、資料作成、デューデリジェンス、契約書作成、技術移管など、安心・安全な取引を実現します。',
  keywords: ['APPEXIT', 'サポートサービス', 'M&Aサポート', '専任担当', '価格査定', 'デューデリジェンス', '契約サポート', '引き継ぎサポート', '売却支援', '購入支援'],
  openGraph: {
    title: 'サポートサービス | APPEXIT',
    description: '専任担当制で出品から成約、引き継ぎまで一貫サポート。安心・安全な取引を実現',
    url: 'https://appexit.jp/support-service',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'サポートサービス | APPEXIT',
    description: '専任担当制で出品から成約、引き継ぎまで一貫サポート。安心・安全な取引を実現',
  },
  alternates: {
    canonical: 'https://appexit.jp/support-service',
  },
}

export default function SupportServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

