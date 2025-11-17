import UserTypeSelectionPage from '@/components/pages/UserTypeSelectionPage';
import type { Locale } from '@/i18n/config';

export default async function OnboardingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  // UserTypeSelectionPageはクライアントコンポーネントでuseTranslations()を使用
  return <UserTypeSelectionPage />;
}
