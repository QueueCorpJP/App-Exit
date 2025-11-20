import NDAAgreementPage from '@/components/pages/NDAAgreementPage';
import type { Locale } from '@/i18n/config';

export default async function NDAPage({ params }: { params: Promise<{ locale: Locale }> }) {
  return <NDAAgreementPage />;
}

