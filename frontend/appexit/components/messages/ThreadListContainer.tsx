'use client';

import { useState, useEffect, memo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { messageApi, ThreadWithLastMessage } from '@/lib/api-client';
import ThreadList from './ThreadList';

interface ThreadListContainerProps {
  onThreadSelect: (threadId: string) => void;
  currentThreadId?: string;
}

function ThreadListContainer({ onThreadSelect, currentThreadId }: ThreadListContainerProps) {
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ThreadWithLastMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // スレッド一覧を取得
  useEffect(() => {
    const fetchThreads = async () => {
      if (authLoading || !user) {
        setIsLoadingThreads(false);
        return;
      }

      try {
        setIsLoadingThreads(true);
        setError(null);
        const response = await messageApi.getThreads();
        if (response.success && response.data) {
          setThreads(response.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch threads:', err);
        setError('スレッドの取得に失敗しました');
      } finally {
        setIsLoadingThreads(false);
      }
    };

    fetchThreads();
  }, [user, authLoading]);

  // スレッド一覧を更新する関数（外部から呼び出し可能にするため、グローバルに公開）
  useEffect(() => {
    const handleUpdateThreads = (event: CustomEvent) => {
      const { threadId, lastMessage } = event.detail;
      setThreads(prev => prev.map(t =>
        t.id === threadId
          ? { ...t, last_message: lastMessage }
          : t
      ));
    };

    window.addEventListener('updateThreadLastMessage' as any, handleUpdateThreads);
    return () => {
      window.removeEventListener('updateThreadLastMessage' as any, handleUpdateThreads);
    };
  }, []);

  const handleThreadSelect = (thread: ThreadWithLastMessage) => {
    // スレッドオブジェクトからIDを抽出して親コンポーネントに渡す
    onThreadSelect(thread.id);
  };

  if (!user) return null;

  return (
    <ThreadList
      threads={threads}
      selectedThreadId={currentThreadId}
      currentUserId={user.id}
      onThreadSelect={handleThreadSelect}
      error={error}
      onErrorDismiss={() => setError(null)}
      isLoading={isLoadingThreads}
    />
  );
}

export default memo(ThreadListContainer);
