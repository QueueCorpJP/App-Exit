import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '反社会的勢力に対する基本方針 | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITの反社会的勢力に対する基本方針。反社会的勢力との一切の関係遮断、不当要求の拒絶、組織的対応を明確化しています。安全・安心な取引環境を提供します。',
  keywords: ['APPEXIT', '反社会的勢力', 'コンプライアンス', '基本方針', '安全対策', '法令遵守'],
  openGraph: {
    title: '反社会的勢力に対する基本方針 | APPEXIT',
    description: '反社会的勢力との一切の関係遮断と安全・安心な取引環境の提供',
    url: 'https://appexit.jp/compliance',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '反社会的勢力に対する基本方針 | APPEXIT',
    description: '反社会的勢力との一切の関係遮断と安全・安心な取引環境の提供',
  },
  alternates: {
    canonical: 'https://appexit.jp/compliance',
  },
}

export default function ComplianceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

