import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'APPEXITについて | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description:
    'APPEXIT（アプリ・Webサービス売買プラットフォーム）についてのご紹介。私たちのミッション、提供価値、安心・安全への取り組みをご案内します。',
  keywords: ['APPEXIT', 'アプリ売買', 'Webサービス売買', '会社概要', 'プラットフォーム紹介'],
  openGraph: {
    title: 'APPEXITについて | APPEXIT',
    description:
      'APPEXITのミッション、提供価値、安心・安全への取り組みをご紹介します。',
    url: 'https://appexit.jp/about',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APPEXITについて | APPEXIT',
    description:
      'APPEXITのミッション、提供価値、安心・安全への取り組みをご紹介します。',
  },
  alternates: {
    canonical: 'https://appexit.jp/about',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}


