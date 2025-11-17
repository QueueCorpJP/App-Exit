export const seminarStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'APPEXIT 説明会・相談会',
  description: 'アプリ・Webサービスの売買について専門スタッフが丁寧にご説明する無料説明会・個別相談会',
  eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
  location: {
    '@type': 'VirtualLocation',
    url: 'https://appexit.jp/seminar'
  },
  organizer: {
    '@type': 'Organization',
    name: 'Queue株式会社',
    url: 'https://appexit.jp'
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
    availability: 'https://schema.org/InStock',
    validFrom: '2024-01-01'
  }
}

export const seminarFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '説明会・相談会は本当に無料ですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'はい、完全無料です。説明会・相談会への参加費用は一切かかりません。実際に出品・購入される場合のみ、取引成立時に手数料が発生します。'
      }
    },
    {
      '@type': 'Question',
      name: '参加には何が必要ですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'オンラインの場合、インターネット環境とZoomやGoogle Meetなどのビデオ通話ツールが使える端末が必要です。事前に簡単なヒアリングシートにご記入いただく場合があります。'
      }
    },
    {
      '@type': 'Question',
      name: '具体的な案件がなくても参加できますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'もちろんです。「将来的に売却を検討している」「まずは情報収集したい」という段階でもお気軽にご参加ください。'
      }
    },
    {
      '@type': 'Question',
      name: '相談内容は秘密にしていただけますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'はい、ご相談内容は厳重に管理し、第三者に開示することはありません。必要に応じてNDA（秘密保持契約）の締結も可能です。'
      }
    },
    {
      '@type': 'Question',
      name: 'キャンセルはできますか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ご予約のキャンセルは可能です。前日までにご連絡いただければ幸いです。'
      }
    },
    {
      '@type': 'Question',
      name: '土日祝日の対応は可能ですか？',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '基本的には平日のみの対応となりますが、ご事情により土日祝日をご希望の場合は個別にご相談ください。可能な限り調整させていただきます。'
      }
    }
  ]
}

export const seminarService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'アプリ・Webサービス売買説明会・相談会',
  provider: {
    '@type': 'Organization',
    name: 'Queue株式会社',
    url: 'https://appexit.jp'
  },
  areaServed: 'JP',
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceUrl: 'https://appexit.jp/seminar'
  },
  audience: {
    '@type': 'Audience',
    audienceType: 'アプリ・Webサービスの売却・購入を検討している方'
  }
}

