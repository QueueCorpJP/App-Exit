import MessagePage from '@/components/pages/MessagePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{
    id: string;
    locale: Locale;
  }>;
}

export default async function Messages({ params }: PageProps) {
  const { id, locale } = await params;
  const messagesDict = await loadPageDictionary(locale, 'messages');
  return <MessagePage threadId={id} pageDict={messagesDict} />;
}
