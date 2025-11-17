'use client';

import { useAuth } from '@/lib/auth-context';
import ChatBot from './ChatBot';

export default function ChatBotWrapper() {
  const { user, loading } = useAuth();

  // ログインしていない場合、またはローディング中は表示しない
  // Not displayed if not logged in or still loading
  if (!user || loading) {
    return null;
  }

  return <ChatBot />;
}
