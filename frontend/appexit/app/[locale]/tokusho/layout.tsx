import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの特定商取引法に基づく表記。販売業者、責任者、所在地、連絡先、手数料、支払方法、返品・キャンセルポリシーなどの法定情報を掲載しています。',
  keywords: ['APPEXIT', '特定商取引法', '特商法', '販売業者情報', '法的表示', '手数料', '返品ポリシー'],
  openGraph: {
    title: '特定商取引法に基づく表記 | APPEXIT',
    description: 'APPEXITの特定商取引法に基づく法定情報',
    url: 'https://appexit.jp/tokusho',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '特定商取引法に基づく表記 | APPEXIT',
    description: 'APPEXITの特定商取引法に基づく法定情報',
  },
  alternates: {
    canonical: 'https://appexit.jp/tokusho',
  },
}

export default function TokushoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

