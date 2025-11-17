import ProfilePage from '@/components/pages/ProfilePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function Profile({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const profileDict = await loadPageDictionary(locale, 'profile');
  return <ProfilePage pageDict={profileDict} />;
}
