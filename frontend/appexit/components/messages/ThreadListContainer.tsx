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
    // マウント状態を追跡
    let isMounted = true;
    const abortController = new AbortController();

    const fetchThreads = async () => {
      if (authLoading || !user) {
        if (isMounted) {
          setIsLoadingThreads(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setIsLoadingThreads(true);
          setError(null);
        }

        const response = await messageApi.getThreads();

        // アンマウントされている場合は処理を中断
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        console.log('[THREAD-LIST] API Response:', response);
        if (response && Array.isArray(response)) {
          console.log('[THREAD-LIST] Threads data:', response);
          response.forEach((thread, index) => {
            console.log(`[THREAD-LIST] Thread ${index}:`, {
              id: thread.id,
              participant_ids: thread.participant_ids,
              participants: thread.participants,
              participantsCount: thread.participants?.length || 0
            });
          });
          setThreads(response);
        } else if (response && typeof response === 'object' && 'success' in response && 'data' in response && response.success) {
          // バックエンドが { success: true, data: [...] } 形式で返す場合
          console.log('[THREAD-LIST] Threads data (wrapped):', response.data);
          if (Array.isArray(response.data)) {
            response.data.forEach((thread, index) => {
              console.log(`[THREAD-LIST] Thread ${index}:`, {
                id: thread.id,
                participant_ids: thread.participant_ids,
                participants: thread.participants,
                participantsCount: thread.participants?.length || 0
              });
            });
            setThreads(response.data);
          }
        }
      } catch (err: any) {
        // アンマウントされている場合はエラーを無視
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        console.error('Failed to fetch threads:', err);
        setError('スレッドの取得に失敗しました');
      } finally {
        if (isMounted) {
          setIsLoadingThreads(false);
        }
      }
    };

    fetchThreads();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      isMounted = false;
      abortController.abort();
    };
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
