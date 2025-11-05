export const contactPageData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'お問い合わせ - APPEXIT',
  description: 'APPEXITへのお問い合わせページ。アプリやWebサービスの売買に関するご質問、ご相談を承ります。',
  url: 'https://appexit.jp/contact',
  mainEntity: {
    '@type': 'Organization',
    name: 'Queue株式会社',
    url: 'https://appexit.jp',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@appexit.jp',
        areaServed: 'JP',
        availableLanguage: ['Japanese'],
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '10:00',
          closes: '19:00'
        }
      }
    ]
  }
}

export const contactFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'APPEXITに会員登録している場合の問い合わせ方法は？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ログインしてからお問い合わせください。プロジェクト掲載に関するご質問やご相談はお問い合わせフォームから。審査やプロジェクトに関するお問い合わせは、プロジェクト管理画面内の「スタッフからの連絡/担当者からのメッセージ」より専任担当者までご連絡ください。'
      }
    },
    {
      '@type': 'Question',
      name: 'お問い合わせの返信にはどのくらいかかりますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'お問い合わせ内容によって異なりますが、通常1〜3営業日以内にご入力いただいたメールアドレス宛に返信いたします。'
      }
    },
    {
      '@type': 'Question',
      name: '営業時間外のお問い合わせは？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'お問い合わせフォームは24時間受け付けております。営業時間外にいただいたお問い合わせは、翌営業日以降に順次対応させていただきます。'
      }
    }
  ]
}

