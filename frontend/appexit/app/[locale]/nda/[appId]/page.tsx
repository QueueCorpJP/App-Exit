import NDAPage from '@/components/pages/NDAPage';
import type { Locale } from '@/i18n/config';

export default async function NDASign({ params }: { params: Promise<{ appId: string; locale: Locale }> }) {
  const { appId } = await params;
  return <NDAPage appId={appId} sellerId="seller123" />;
}
