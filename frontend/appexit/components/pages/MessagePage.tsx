'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageApi } from '@/lib/api-client';
import Link from 'next/link';
import ThreadListContainer from '@/components/messages/ThreadListContainer';
import MessageThreadContainer from '@/components/messages/MessageThreadContainer';

interface MessagePageProps {
  threadId?: string;
}

// UUID形式かどうかをチェックする関数
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default function MessagePage({ threadId: initialThreadId }: MessagePageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(initialThreadId);
  const [isResolvingThreadId, setIsResolvingThreadId] = useState(false);
  // 初期threadIdがUUID形式の場合は即座に解決済みとして扱う
  const [resolvedThreadId, setResolvedThreadId] = useState<string | undefined>(
    initialThreadId && isUUID(initialThreadId) ? initialThreadId : undefined
  );
  const isHandlingThreadIdRef = useRef(false);
  const processedThreadIdRef = useRef<string | null>(
    initialThreadId && isUUID(initialThreadId) ? initialThreadId : null
  );
  const userInitiatedSelectionRef = useRef(false);

  // 初期threadIdを状態に設定
  useEffect(() => {
    if (initialThreadId && initialThreadId !== selectedThreadId) {
      setSelectedThreadId(initialThreadId);
      // UUID形式の場合は即座に解決済みとして扱う
      if (isUUID(initialThreadId)) {
        setResolvedThreadId(initialThreadId);
        setIsResolvingThreadId(false);
        processedThreadIdRef.current = initialThreadId;
      } else {
        // UUID形式でない場合は、一度リセットして再解決を促す
        setResolvedThreadId(undefined);
        setIsResolvingThreadId(false);
        processedThreadIdRef.current = null;
      }
    }
  }, [initialThreadId]);

  // ブラウザの戻る/進むボタンへの対応
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/messages\/(.+)/);
      if (match) {
        const threadId = match[1];
        setSelectedThreadId(threadId);
        // UUID形式の場合は即座に解決済みとして扱う
        if (isUUID(threadId)) {
          setResolvedThreadId(threadId);
          setIsResolvingThreadId(false);
          processedThreadIdRef.current = threadId;
        } else {
          // UUID形式でない場合は、リセットして再解決を促す
          setResolvedThreadId(undefined);
          setIsResolvingThreadId(false);
          processedThreadIdRef.current = null;
        }
      } else {
        setSelectedThreadId(undefined);
        setResolvedThreadId(undefined);
        setIsResolvingThreadId(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // selectedThreadIdが指定されている場合、該当するスレッドを選択または作成
  useEffect(() => {
    // マウント状態を追跡
    let isMounted = true;

    const handleThreadId = async () => {
      if (!selectedThreadId || !user || authLoading) {
        if (isMounted) {
          setIsResolvingThreadId(false);
          setResolvedThreadId(undefined);
        }
        return;
      }

      // 処理中の場合はスキップ
      if (isHandlingThreadIdRef.current) {
        return;
      }

      // 既に処理済みのthreadIdの場合はスキップ
      if (processedThreadIdRef.current === selectedThreadId) {
        // 既に解決済みの場合は、resolvedThreadIdも設定されているはずだが、念のため確認
        if (isMounted && !resolvedThreadId && isUUID(selectedThreadId)) {
          setResolvedThreadId(selectedThreadId);
          setIsResolvingThreadId(false);
        }
        return;
      }

      // UUID形式の場合は、スレッドIDとして直接使用
      if (isUUID(selectedThreadId)) {
        // スレッドIDとして直接取得を試みる
        isHandlingThreadIdRef.current = true;
        processedThreadIdRef.current = selectedThreadId;
        
        if (isMounted) {
          setIsResolvingThreadId(true);
        }

        try {
          const threadDetailResponse = await messageApi.getThread(selectedThreadId);

          // アンマウントされている場合は処理を中断
          if (!isMounted) {
            isHandlingThreadIdRef.current = false;
            return;
          }

          if (threadDetailResponse.success && threadDetailResponse.data) {
            // 有効なスレッドIDが見つかった
            if (isMounted) {
              setResolvedThreadId(selectedThreadId);
              setIsResolvingThreadId(false);
            }
            isHandlingThreadIdRef.current = false;
            return;
          } else {
            // スレッドが見つからない場合
            if (isMounted) {
              setError('このスレッドは存在しないか、削除されました');
              setIsResolvingThreadId(false);
              setResolvedThreadId(undefined);
            }
            isHandlingThreadIdRef.current = false;
            return;
          }
        } catch (threadErr: any) {
          if (!isMounted) {
            isHandlingThreadIdRef.current = false;
            return;
          }

          if ((threadErr as any)?.status === 404) {
            // 404エラーの場合
            if (isMounted) {
              setError('このスレッドは存在しないか、削除されました');
              setIsResolvingThreadId(false);
              setResolvedThreadId(undefined);
            }
          } else {
            console.error('[MESSAGE-PAGE] Failed to get thread:', threadErr.message);
            if (isMounted) {
              setError('スレッドの取得に失敗しました');
              setIsResolvingThreadId(false);
              setResolvedThreadId(undefined);
            }
          }
          isHandlingThreadIdRef.current = false;
          return;
        }
      }

      // UUID形式でない場合は、ユーザーIDとして扱う
      isHandlingThreadIdRef.current = true;
      processedThreadIdRef.current = selectedThreadId;
      
      if (isMounted) {
        setIsResolvingThreadId(true);
        setResolvedThreadId(undefined);
      }

      try {
        // 自分自身とのスレッド作成を防ぐ
        if (selectedThreadId === user.id) {
          if (isMounted) {
            setError('自分自身とのメッセージスレッドは作成できません');
            setIsResolvingThreadId(false);
          }
          isHandlingThreadIdRef.current = false;
          return;
        }

        // selectedThreadIdをユーザーIDとして扱い、既存スレッドを検索
        console.log('[MESSAGE-PAGE] Checking for existing thread with user:', selectedThreadId);
        const threadsResponse = await messageApi.getThreads();

        // アンマウントされている場合は処理を中断
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        if (threadsResponse.success && threadsResponse.data) {
          // 同じユーザーとの既存スレッドを検索
          const existingThread = threadsResponse.data.find(thread => {
            // participant_idsに指定されたユーザーIDが含まれているかチェック
            // スレッドは通常2人の参加者（自分と相手）を持つ
            return thread.participant_ids.includes(selectedThreadId) &&
                   thread.participant_ids.length === 2;
          });

          if (existingThread) {
            console.log('[MESSAGE-PAGE] Found existing thread:', existingThread.id);

            // アンマウントされている場合は処理を中断
            if (!isMounted) {
              isHandlingThreadIdRef.current = false;
              return;
            }

            // 既存スレッドが見つかった場合、状態を更新（ページ遷移なし）
            setSelectedThreadId(existingThread.id);
            setResolvedThreadId(existingThread.id);
            setIsResolvingThreadId(false);
            window.history.replaceState(null, '', `/messages/${existingThread.id}`);
            isHandlingThreadIdRef.current = false;
            return;
          }
        }

        // 既存スレッドがない場合のみ新規作成
        console.log('[MESSAGE-PAGE] Creating new thread with user:', selectedThreadId);
        const createResponse = await messageApi.createThread({
          participant_ids: [selectedThreadId],
        });

        // アンマウントされている場合は処理を中断
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        if (!createResponse.success || !createResponse.data) {
          throw new Error('スレッドの作成に失敗しました');
        }

        // 状態を更新してURLを変更（ページ遷移なし）
        const newThreadId = createResponse.data.id;
        setSelectedThreadId(newThreadId);
        setResolvedThreadId(newThreadId);
        setIsResolvingThreadId(false);
        window.history.replaceState(null, '', `/messages/${newThreadId}`);
        isHandlingThreadIdRef.current = false;
      } catch (err: any) {
        // アンマウントされている場合はエラーを無視
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        console.error('Failed to handle thread ID:', err);
        setError(err.message || 'スレッドの取得に失敗しました');
        setIsResolvingThreadId(false);
        setResolvedThreadId(undefined);
        isHandlingThreadIdRef.current = false;
      }
    };

    handleThreadId();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      isMounted = false;
      isHandlingThreadIdRef.current = false;
    };
  }, [selectedThreadId, user, authLoading]);

  const handleThreadSelect = useCallback((newThreadId: string) => {
    userInitiatedSelectionRef.current = true;
    processedThreadIdRef.current = newThreadId;

    // 状態を更新（これだけでレンダリング）
    setSelectedThreadId(newThreadId);
    setResolvedThreadId(newThreadId);
    setIsResolvingThreadId(false);

    // URLも更新（ページ遷移なし）
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/messages/${newThreadId}`);
    }
  }, []);

  const handleBackToThreads = useCallback(() => {
    processedThreadIdRef.current = null;

    // 状態をクリア
    setSelectedThreadId(undefined);
    setResolvedThreadId(undefined);
    setIsResolvingThreadId(false);

    // URLを更新
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/messages');
    }
  }, []);

  // スマホ画面ではselectedThreadIdでレンダリングを制御、デスクトップでは常に表示
  const isMobileView = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
  const showThreadList = useMemo(() => isMobileView ? !selectedThreadId : true, [isMobileView, selectedThreadId]);
  const showMessageThread = useMemo(() => isMobileView ? !!selectedThreadId : true, [isMobileView, selectedThreadId]);


  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-white">
      {/* スレッド一覧: スマホではselectedThreadIdがない時のみ表示、デスクトップでは常に表示 */}
      <div className={`w-full h-full ${showThreadList ? 'block' : 'hidden'} md:block md:w-auto`}>
        <ThreadListContainer
          onThreadSelect={handleThreadSelect}
          currentThreadId={selectedThreadId}
        />
      </div>

      {/* メッセージスレッド: スマホではselectedThreadIdがある時のみ表示、デスクトップでは常に表示 */}
      <div className={`w-full h-full ${showMessageThread ? 'block' : 'hidden'} md:block md:flex-1`}>
        {isResolvingThreadId ? (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">スレッドを読み込み中...</p>
            </div>
          </div>
        ) : (
          <MessageThreadContainer
            threadId={resolvedThreadId}
            onBack={handleBackToThreads}
          />
        )}
      </div>
    </div>
  );
}
