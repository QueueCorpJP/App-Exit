import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { Locale } from '@/i18n/config';

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;

  // about専用辞書を動的ロード
  const aboutDict = await loadPageDictionary(locale, 'about');

  // ヘルパー関数
  const tp = (key: string) => {
    const keys = key.split('.');
    let value: any = aboutDict;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-12 text-center">{t('footer.about')}</h1>
          <p className="text-gray-700 mb-10">
            {tp('introduction')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{tp('mission')}</h2>
              <p className="text-gray-700">
                {tp('missionDescription')}
              </p>
            </div>
            <div className="border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{tp('value')}</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>{tp('valueItem1')}</li>
                <li>{tp('valueItem2')}</li>
                <li>{tp('valueItem3')}</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 p-6 mb-10 bg-blue-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{tp('safetyTitle')}</h2>
            <p className="text-gray-700 mb-3">
              {tp('safetyDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={`/${locale}/security`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.security')}
              </a>
              <a href={`/${locale}/compliance`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.compliance')}
              </a>
              <a href={`/${locale}/privacy`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.privacy')}
              </a>
              <a href={`/${locale}/cookie-policy`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.cookiePolicy')}
              </a>
            </div>
          </div>

          <div className="border border-gray-200 p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{tp('whatIsTitle')}</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                {tp('whatIsDescription')}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{tp('whatIsFeature1')}</li>
                <li>{tp('whatIsFeature2')}</li>
                <li>{tp('whatIsFeature3')}</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('common.relatedLinks')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href={`/${locale}/faq`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.faq')}
              </a>
              <a href={`/${locale}/contact`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.contact')}
              </a>
              <a href={`/${locale}/terms`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.terms')}
              </a>
              <a href={`/${locale}/tokusho`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.tokusho')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


