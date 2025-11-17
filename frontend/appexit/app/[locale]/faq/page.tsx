import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { Locale } from '@/i18n/config';

export default async function FAQPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;

  // FAQ専用辞書を動的ロード
  const faqDict = await loadPageDictionary(locale, 'faq');

  // ヘルパー関数
  const tp = (key: string) => {
    const keys = key.split('.');
    let value: any = faqDict;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // FAQ構造化データ
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      // Selling category
      ...Array.from({ length: 8 }, (_, i) => ({
        '@type': 'Question',
        name: tp(`selling.q${i + 1}`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tp(`selling.a${i + 1}`)
        }
      })),
      // Buying category
      ...Array.from({ length: 6 }, (_, i) => ({
        '@type': 'Question',
        name: tp(`buying.q${i + 1}`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tp(`buying.a${i + 1}`)
        }
      })),
      // About Service category
      ...Array.from({ length: 10 }, (_, i) => ({
        '@type': 'Question',
        name: tp(`aboutService.q${i + 1}`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tp(`aboutService.a${i + 1}`)
        }
      })),
      // Procedures category
      ...Array.from({ length: 5 }, (_, i) => ({
        '@type': 'Question',
        name: tp(`procedures.q${i + 1}`),
        acceptedAnswer: {
          '@type': 'Answer',
          text: tp(`procedures.a${i + 1}`)
        }
      }))
    ]
  };

  const categories = [
    {
      key: 'selling',
      title: tp('categories.selling'),
      count: 8
    },
    {
      key: 'buying',
      title: tp('categories.buying'),
      count: 6
    },
    {
      key: 'aboutService',
      title: tp('categories.aboutService'),
      count: 10
    },
    {
      key: 'procedures',
      title: tp('categories.procedures'),
      count: 5
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="min-h-screen bg-[#F9F8F7] py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-2xl font-bold mb-12 text-center" style={{ color: '#323232' }}>
              {tp('title')}
            </h1>
            <p className="text-lg" style={{ color: '#323232' }}>
              {tp('subtitle')}
            </p>
          </div>

          {/* FAQ一覧 */}
          {categories.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-[#FF6B35]">
                {category.title}
              </h2>
              <div className="space-y-6">
                {Array.from({ length: category.count }, (_, itemIdx) => (
                  <div key={itemIdx} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start">
                      <span className="bg-[#FF6B35] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                        Q
                      </span>
                      {tp(`${category.key}.q${itemIdx + 1}`)}
                    </h3>
                    <div className="ml-9 text-gray-700 leading-relaxed">
                      <span className="font-semibold text-[#FF6B35] mr-2">A:</span>
                      {tp(`${category.key}.a${itemIdx + 1}`)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 関連リンク */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`/${locale}/support-service`}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">{tp('relatedLinks.supportService')}</h3>
              <p className="text-sm text-gray-600">{tp('relatedLinks.supportServiceDescription')}</p>
            </a>
            <a
              href={`/${locale}/terms`}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">{t('common.terms')}</h3>
              <p className="text-sm text-gray-600">{tp('relatedLinks.termsDescription')}</p>
            </a>
            <a
              href={`/${locale}/privacy`}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">{t('common.privacy')}</h3>
              <p className="text-sm text-gray-600">{tp('relatedLinks.privacyDescription')}</p>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
