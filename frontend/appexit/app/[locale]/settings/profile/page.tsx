import ProfileSettingsPage from '@/components/pages/ProfileSettingsPage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function ProfileSettings({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const settingsDict = await loadPageDictionary(locale, 'settings');
  return <ProfileSettingsPage pageDict={settingsDict} locale={locale} />;
}
