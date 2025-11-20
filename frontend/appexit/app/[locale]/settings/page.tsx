import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';
import SettingsIndexPageClient from '@/components/pages/SettingsIndexPageClient';

export default async function SettingsIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;
  const settingsDict = await loadPageDictionary(locale, 'settings');
  const tp = createPageDictHelper(settingsDict);

  // 翻訳データを準備
  const translations = {
    title: tp('title'),
    description: tp('description'),
    profile: {
      title: tp('profile.title'),
      description: tp('profile.description'),
    },
    help: {
      title: tp('help.title'),
      description: tp('help.description'),
      separator: tp('help.separator'),
      suffix: tp('help.suffix'),
    },
  };

  const commonTranslations = {
    help: t('common.help'),
    faq: t('common.faq'),
  };

  return (
    <SettingsIndexPageClient
      locale={locale}
      translations={translations}
      commonTranslations={commonTranslations}
    />
  );
}


