'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';

interface SettingsIndexPageClientProps {
  locale: string;
  translations: {
    title: string;
    description: string;
    profile: {
      title: string;
      description: string;
    };
    help: {
      title: string;
      description: string;
      separator: string;
      suffix: string;
    };
  };
  commonTranslations: {
    help: string;
    faq: string;
  };
}

export default function SettingsIndexPageClient({ locale, translations, commonTranslations }: SettingsIndexPageClientProps) {
  const { loading } = useAuthGuard();

  // ローディング中は何も表示しない（リダイレクト判定中）
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{translations.title}</h1>
          <p className="mb-8 text-center">{translations.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/settings/profile`}
              className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-1">{translations.profile.title}</h2>
              <p className="text-sm">{translations.profile.description}</p>
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold mb-2">{translations.help.title}</h3>
            <p className="text-sm">
              {translations.help.description}{' '}
              <Link href={`/${locale}/help`} className="text-blue-600 hover:text-blue-800 underline">
                {commonTranslations.help}
              </Link>
              {translations.help.separator}
              <Link href={`/${locale}/faq`} className="text-blue-600 hover:text-blue-800 underline">
                {commonTranslations.faq}
              </Link>
              {translations.help.suffix}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
