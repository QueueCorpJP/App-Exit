'use client';

import { useState, useEffect, useCallback, memo } from 'react';
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

  // スレッド一覧を取得する関数
  const fetchThreads = useCallback(async (abortController?: AbortController) => {
    if (authLoading || !user) {
      setIsLoadingThreads(false);
      return;
    }

    try {
      setIsLoadingThreads(true);
      setError(null);

      const response = await messageApi.getThreads();

      // アンマウントされている場合は処理を中断
      if (abortController?.signal.aborted) {
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
      } else if (response && typeof response === 'object' && 'success' in response && 'data' in response && (response as any).success) {
        // バックエンドが { success: true, data: [...] } 形式で返す場合
        console.log('[THREAD-LIST] Threads data (wrapped):', (response as any).data);
        if (Array.isArray((response as any).data)) {
          (response as any).data.forEach((thread: any, index: number) => {
            console.log(`[THREAD-LIST] Thread ${index}:`, {
              id: thread.id,
              participant_ids: thread.participant_ids,
              participants: thread.participants,
              participantsCount: thread.participants?.length || 0
            });
          });
          setThreads((response as any).data);
        }
      }
    } catch (err: any) {
      // アンマウントされている場合はエラーを無視
      if (abortController?.signal.aborted) {
        return;
      }

      console.error('Failed to fetch threads:', err);
      setError('スレッドの取得に失敗しました');
    } finally {
      setIsLoadingThreads(false);
    }
  }, [user, authLoading]);

  // スレッド一覧を取得
  useEffect(() => {
    // マウント状態を追跡
    let isMounted = true;
    const abortController = new AbortController();

    fetchThreads(abortController);

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [fetchThreads]);

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

    // スレッド一覧を再取得するイベントハンドラ
    const handleRefreshThreads = () => {
      console.log('[THREAD-LIST] Refresh threads event received');
      fetchThreads();
    };

    window.addEventListener('updateThreadLastMessage' as any, handleUpdateThreads);
    window.addEventListener('refreshThreads' as any, handleRefreshThreads);
    return () => {
      window.removeEventListener('updateThreadLastMessage' as any, handleUpdateThreads);
      window.removeEventListener('refreshThreads' as any, handleRefreshThreads);
    };
  }, [fetchThreads]);

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
