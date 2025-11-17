export const supportServiceData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'APPEXITサポートサービス',
  description: 'アプリ・Webサービスの売買を成功に導く充実のサポート体制。専任担当制で出品から成約、引き継ぎまで一貫サポート。',
  provider: {
    '@type': 'Organization',
    name: 'Queue株式会社',
    url: 'https://appexit.jp',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+81-3-XXXX-XXXX',
      contactType: 'customer service',
      areaServed: 'JP',
      availableLanguage: 'Japanese'
    }
  },
  serviceType: 'M&Aサポートサービス',
  areaServed: 'JP',
  category: [
    'アプリM&A',
    'Webサービス売買',
    'デューデリジェンス',
    '価格査定',
    '契約サポート'
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'サポートサービス一覧',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: '売り手向けサポート',
          description: '価格査定、出品資料作成、マッチング、デューデリジェンス対応、契約書作成、引き継ぎサポート'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: '買い手向けサポート',
          description: '案件紹介、案件分析・評価、デューデリジェンス支援、価格交渉、契約・決済、引き継ぎ・運用サポート'
        }
      }
    ]
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'アプリ・Webサービスの売却・購入を検討している事業者'
  }
}

export const howToSellApp = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'APPEXITでアプリ・Webサービスを売却する方法',
  description: 'APPEXITを利用してアプリやWebサービスを安全に売却する手順',
  step: [
    {
      '@type': 'HowToStep',
      name: '価格査定・相場アドバイス',
      text: '過去の取引データや市場動向を基に、適正な売却価格をアドバイス',
      position: 1
    },
    {
      '@type': 'HowToStep',
      name: '出品資料の作成サポート',
      text: '魅力的な出品ページの作成をサポート。買い手の興味を引くポイントを専門家がアドバイス',
      position: 2
    },
    {
      '@type': 'HowToStep',
      name: '買い手とのマッチング',
      text: '条件に合う買い手候補を積極的にご紹介。スムーズなマッチングを実現',
      position: 3
    },
    {
      '@type': 'HowToStep',
      name: 'デューデリジェンス対応',
      text: '買い手からの質問対応や資料準備をサポート。安心して取引を進められます',
      position: 4
    },
    {
      '@type': 'HowToStep',
      name: '契約書作成・交渉サポート',
      text: '契約条件の交渉から契約書作成まで、専門家がサポート',
      position: 5
    },
    {
      '@type': 'HowToStep',
      name: '引き継ぎサポート',
      text: '成約後のスムーズな引き継ぎをサポート。トラブルを未然に防ぎます',
      position: 6
    }
  ]
}

export const howToBuyApp = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'APPEXITでアプリ・Webサービスを購入する方法',
  description: 'APPEXITを利用してアプリやWebサービスを安全に購入する手順',
  step: [
    {
      '@type': 'HowToStep',
      name: '案件紹介・マッチング',
      text: 'ご希望に合う案件を積極的にご紹介。非公開案件の情報も優先的にお届け',
      position: 1
    },
    {
      '@type': 'HowToStep',
      name: '案件分析・評価サポート',
      text: '気になる案件の分析・評価をサポート。購入判断に必要な情報を提供',
      position: 2
    },
    {
      '@type': 'HowToStep',
      name: 'デューデリジェンス支援',
      text: '技術面・ビジネス面の詳細調査をサポート。専門家による確認も手配可能',
      position: 3
    },
    {
      '@type': 'HowToStep',
      name: '価格交渉サポート',
      text: '適正価格での購入を実現。交渉のポイントをアドバイス',
      position: 4
    },
    {
      '@type': 'HowToStep',
      name: '契約・決済サポート',
      text: '契約書の確認から決済まで、安全な取引をサポート',
      position: 5
    },
    {
      '@type': 'HowToStep',
      name: '引き継ぎ・運用サポート',
      text: '購入後の引き継ぎから運用開始までをサポート。必要に応じて運用代行も可能',
      position: 6
    }
  ]
}

