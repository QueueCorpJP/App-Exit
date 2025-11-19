import MessagePage from '@/components/pages/MessagePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function MessagesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;
  return <MessagePage />;
}
