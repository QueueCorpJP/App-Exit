import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'お問い合わせ | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITへのお問い合わせはこちら。アプリやWebサービスの売買に関するご質問、ご相談を専門スタッフが丁寧にサポートいたします。売却相談、購入相談、取引に関するお問い合わせを承っております。',
  keywords: ['APPEXIT', 'お問い合わせ', 'アプリ売買', 'Webサービス売買', 'M&A', '相談', 'サポート', '売却相談', '購入相談'],
  openGraph: {
    title: 'お問い合わせ | APPEXIT',
    description: 'アプリ・Webサービスの売買に関するご質問、ご相談を専門スタッフがサポート',
    url: 'https://appexit.jp/contact',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お問い合わせ | APPEXIT',
    description: 'アプリ・Webサービスの売買に関するご質問、ご相談を専門スタッフがサポート',
  },
  alternates: {
    canonical: 'https://appexit.jp/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

