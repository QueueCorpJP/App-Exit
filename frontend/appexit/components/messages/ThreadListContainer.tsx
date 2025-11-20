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
  const [refreshKey, setRefreshKey] = useState(0);

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

      console.log('[ThreadListContainer] Raw response:', response);
      console.log('[ThreadListContainer] Response type:', typeof response);
      console.log('[ThreadListContainer] Is array?', Array.isArray(response));

      if (response && Array.isArray(response)) {
        console.log('[ThreadListContainer] Setting threads (array):', response);
        console.log('[ThreadListContainer] First thread:', response[0]);
        if (response[0]) {
          console.log('[ThreadListContainer] First thread participants:', response[0].participants);
        }
        setThreads(response);
      } else if (response && typeof response === 'object' && 'success' in response && 'data' in response && (response as any).success) {
        // バックエンドが { success: true, data: [...] } 形式で返す場合
        console.log('[ThreadListContainer] Response has success/data structure');
        if (Array.isArray((response as any).data)) {
          console.log('[ThreadListContainer] Setting threads (data array):', (response as any).data);
          console.log('[ThreadListContainer] First thread:', (response as any).data[0]);
          if ((response as any).data[0]) {
            console.log('[ThreadListContainer] First thread participants:', (response as any).data[0].participants);
          }
          setThreads((response as any).data);
        }
      }
    } catch (err: any) {
      // アンマウントされている場合はエラーを無視
      if (abortController?.signal.aborted) {
        return;
      }

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
    const handleRefreshThreads = async () => {
      console.log('refreshThreads event received - re-rendering thread list');
      // スレッド一覧を再取得してから強制再レンダリング
      await fetchThreads();
      // fetchThreads完了後に強制的に再レンダリングを実行
      setRefreshKey(prev => prev + 1);
      console.log('Thread list refreshed and re-rendered');
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
      key={refreshKey}
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
