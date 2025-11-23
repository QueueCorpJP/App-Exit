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
      // サーバーサイドでは内部通信用のURLを使用（BFF_INTERNAL_URLまたはlocalhost）
      // これによりサーバー内部で直接BFFにアクセス（Nginxを経由しない）
      const bffUrl = process.env.BFF_INTERNAL_URL || 'http://localhost:8082';
      const response = await fetch(
        `${bffUrl}/bff/thread-and-messages?thread_id=${id}&limit=50&offset=0`,
        {
          headers: {
            Cookie: `access_token=${authToken.value}`, // 🔥 Go APIのCookie優先に合わせる
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
