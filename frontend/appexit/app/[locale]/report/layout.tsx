import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '違反報告 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITで不適切なコンテンツや行為を発見した場合は、こちらからご報告ください。詐欺、スパム、著作権侵害、ハラスメントなどの違反行為に迅速に対応いたします。',
  keywords: ['APPEXIT', '違反報告', '通報', '不適切なコンテンツ', '詐欺', 'スパム', '著作権侵害', 'ハラスメント', '安全'],
  openGraph: {
    title: '違反報告 | APPEXIT',
    description: '不適切なコンテンツや行為を発見した場合はご報告ください',
    url: 'https://appexit.jp/report',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '違反報告 | APPEXIT',
    description: '不適切なコンテンツや行為を発見した場合はご報告ください',
  },
  alternates: {
    canonical: 'https://appexit.jp/report',
  },
  robots: {
    index: false, // 報告ページは検索エンジンにインデックスさせない
    follow: true,
  },
}

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

