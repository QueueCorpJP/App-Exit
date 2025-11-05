import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'よくある質問（FAQ） | APPEXIT - アプリ・Webサービス売買プラットフォーム',
  description: 'APPEXITに関するよくある質問。アプリ・Webサービスの売却・購入、手数料、期間、サポート内容など、お客様からよくいただく質問にお答えします。FlippaやAcquire.comとの違いも解説。',
  keywords: 'FAQ, よくある質問, アプリ売買, Webサービス売買, 売却方法, 購入方法, 手数料, APPEXIT, Flippa 違い, Acquire.com 違い',
  openGraph: {
    title: 'よくある質問（FAQ） | APPEXIT',
    description: 'アプリ・Webサービスの売買に関するよくある質問。売却・購入の流れ、手数料、サポート内容などを詳しく解説。',
    url: 'https://appexit.jp/faq',
    siteName: 'APPEXIT',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'よくある質問（FAQ） | APPEXIT',
    description: 'アプリ・Webサービスの売買に関するよくある質問。売却・購入の流れ、手数料、サポート内容などを詳しく解説。',
  },
  alternates: {
    canonical: 'https://appexit.jp/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

