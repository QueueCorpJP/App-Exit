import MessagePage from '@/components/pages/MessagePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';
import { cookies } from 'next/headers';

interface PageProps {
  params: Promise<{
    id: string;
    locale: Locale;
  }>;
}

interface ThreadAndMessagesData {
  thread: any | null;
  messages: any[];
}

export default async function Messages({ params }: PageProps) {
  const { id, locale } = await params;
  const messagesDict = await loadPageDictionary(locale, 'messages');

  // サーバーサイドでBFFからデータを取得
  let initialData: ThreadAndMessagesData | null = null;
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');

    if (authToken?.value) {
      const bffUrl = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8082';
      const response = await fetch(
        `${bffUrl}/bff/thread-and-messages?thread_id=${id}&limit=50&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${authToken.value}`,
          },
          next: { revalidate: 0 }, // キャッシュしない
        }
      );

      if (response.ok) {
        initialData = await response.json();
      }
    }
  } catch (error) {
    console.error('Failed to fetch thread data:', error);
  }

  return <MessagePage threadId={id} pageDict={messagesDict} initialData={initialData} />;
}
