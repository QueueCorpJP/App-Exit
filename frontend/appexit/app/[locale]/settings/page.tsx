import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function SettingsIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;
  const settingsDict = await loadPageDictionary(locale, 'settings');
  const tp = createPageDictHelper(settingsDict);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{tp('title')}</h1>
          <p className="mb-8 text-center">{tp('description')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/settings/profile`}
              className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-1">{tp('profile.title')}</h2>
              <p className="text-sm">{tp('profile.description')}</p>
            </Link>

            <Link
              href={`/${locale}/settings/payment`}
              className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-1">{tp('payment.title')}</h2>
              <p className="text-sm">{tp('payment.description')}</p>
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold mb-2">{tp('help.title')}</h3>
            <p className="text-sm">
              {tp('help.description')}{' '}
              <Link href={`/${locale}/help`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.help')}
              </Link>
              {tp('help.separator')}
              <Link href={`/${locale}/faq`} className="text-blue-600 hover:text-blue-800 underline">
                {t('common.faq')}
              </Link>
              {tp('help.suffix')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


