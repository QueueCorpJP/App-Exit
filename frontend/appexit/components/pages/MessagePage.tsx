'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { messageApi } from '@/lib/api-client';
import Link from 'next/link';
import ThreadListContainer from '@/components/messages/ThreadListContainer';
import MessageThreadContainer from '@/components/messages/MessageThreadContainer';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface ThreadAndMessagesData {
  thread: any | null;
  messages: any[];
}

interface MessagePageProps {
  threadId?: string;
  pageDict?: Record<string, any>;
  initialData?: ThreadAndMessagesData | null;
}

// UUID形式かどうかをチェックする関数
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default function MessagePage({ threadId: initialThreadId, pageDict, initialData }: MessagePageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const { loading: authGuardLoading } = useAuthGuard();
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
      if (!selectedThreadId || !user) {
        if (isMounted) {
          setIsResolvingThreadId(false);
          setResolvedThreadId(undefined);
        }
        return;
      }

      // authLoading中は処理をスキップ（ただしresolvedThreadIdはリセットしない）
      if (authLoading) {
        return;
      }

      // 処理中の場合はスキップ
      if (isHandlingThreadIdRef.current) {
        return;
      }

      // 既に解決済みで、selectedThreadIdとresolvedThreadIdが一致している場合はスキップ
      if (processedThreadIdRef.current === selectedThreadId && resolvedThreadId === selectedThreadId) {
        return;
      }

      // processedだがresolvedThreadIdが未設定の場合は復元
      if (processedThreadIdRef.current === selectedThreadId && !resolvedThreadId && isUUID(selectedThreadId)) {
        if (isMounted) {
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

          // レスポンス形式を統一
          let threadData: any = null;
          if (threadDetailResponse && typeof threadDetailResponse === 'object') {
            if ('id' in threadDetailResponse) {
              threadData = threadDetailResponse;
            } else if ('success' in threadDetailResponse && 'data' in threadDetailResponse && (threadDetailResponse as any).success) {
              threadData = (threadDetailResponse as any).data;
            }
          }

          if (threadData && 'id' in threadData) {
            // 有効なスレッドIDが見つかった（バックエンドが作成した可能性もある）
            if (isMounted) {
              const newThreadId = threadData.id;
              // processedThreadIdRefを先に更新して無限ループを防ぐ
              processedThreadIdRef.current = newThreadId;
              // URLも更新（バックエンドが作成した場合は新しいthread IDに更新）
              if (newThreadId !== selectedThreadId) {
                window.history.replaceState(null, '', `/messages/${newThreadId}`);
                setSelectedThreadId(newThreadId);
              }
              setResolvedThreadId(newThreadId);
              setIsResolvingThreadId(false);
            }
            isHandlingThreadIdRef.current = false;
            return;
          } else {
            // スレッドが見つからない場合
            if (isMounted) {
              setError(t('messageThreadNotFound'));
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
            // 404エラーの場合、バックエンドが自動的にthreadを作成してくれる可能性がある
            // selectedThreadIdがユーザーIDである可能性があるので、再取得を試みる
            
            // 少し待ってから再取得を試みる（バックエンドがthreadを作成する時間を確保）
            await new Promise(resolve => setTimeout(resolve, 200));
            
            try {
              // バックエンドが自動的にthreadを作成してくれるので、再取得を試みる
              const retryResponse = await messageApi.getThread(selectedThreadId);

              if (!isMounted) {
                isHandlingThreadIdRef.current = false;
                return;
              }

              // レスポンス形式を統一
              let threadData: any = null;
              if (retryResponse && typeof retryResponse === 'object') {
                if ('id' in retryResponse) {
                  threadData = retryResponse;
                } else if ('success' in retryResponse && 'data' in retryResponse && (retryResponse as any).success) {
                  threadData = (retryResponse as any).data;
                }
              }

              if (threadData && 'id' in threadData) {
                // バックエンドがthreadを作成してくれた
                const newThreadId = threadData.id;
                // processedThreadIdRefを更新して無限ループを防ぐ
                processedThreadIdRef.current = newThreadId;
                setSelectedThreadId(newThreadId);
                setResolvedThreadId(newThreadId);
                setIsResolvingThreadId(false);
                window.history.replaceState(null, '', `/messages/${newThreadId}`);
                
                // スレッド一覧を再取得するイベントを発火
                const refreshEvent = new CustomEvent('refreshThreads');
                window.dispatchEvent(refreshEvent);
                
                isHandlingThreadIdRef.current = false;
                return;
              }
            } catch (retryErr: any) {
              // 再取得も失敗した場合
              
              // selectedThreadIdが自分自身でない場合、ユーザーIDとして扱ってthreadを作成を試みる
              if (selectedThreadId !== user.id) {
                try {
                  const createResponse = await messageApi.createThread({
                    participant_ids: [selectedThreadId],
                  });

                  if (!isMounted) {
                    isHandlingThreadIdRef.current = false;
                    return;
                  }

                  // レスポンス形式を統一
                  let threadData: any = null;
                  if (createResponse && typeof createResponse === 'object') {
                    if ('id' in createResponse) {
                      threadData = createResponse;
                    } else if ('success' in createResponse && 'data' in createResponse && (createResponse as any).success) {
                      threadData = (createResponse as any).data;
                    }
                  }

                  if (threadData && 'id' in threadData) {
                    const newThreadId = threadData.id;
                    // processedThreadIdRefを更新して無限ループを防ぐ
                    processedThreadIdRef.current = newThreadId;
                    setSelectedThreadId(newThreadId);
                    setResolvedThreadId(newThreadId);
                    setIsResolvingThreadId(false);
                    window.history.replaceState(null, '', `/messages/${newThreadId}`);
                    
                    // スレッド一覧を再取得するイベントを発火
                    const refreshEvent = new CustomEvent('refreshThreads');
                    window.dispatchEvent(refreshEvent);
                    
                    isHandlingThreadIdRef.current = false;
                    return;
                  }
                } catch (createErr) {
                  // Failed to create thread - continue with error handling
                }
              }
            }

            // threadを作成できない場合、エラーメッセージを表示
            if (isMounted) {
              setError(t('messageThreadNotFound'));
              setIsResolvingThreadId(false);
              setResolvedThreadId(undefined);
            }
          } else {
            if (isMounted) {
              setError(t('messageFetchFailed'));
              setIsResolvingThreadId(false);
              setResolvedThreadId(undefined);
            }
          }
          isHandlingThreadIdRef.current = false;
          return;
        } finally {
          // 確実にisHandlingThreadIdRefをfalseにする
          isHandlingThreadIdRef.current = false;
          // ただし、resolvedThreadIdが設定されている場合は、isResolvingThreadIdは既にfalseになっているはずなので、
          // ここでは設定しない（成功した場合は既にfalseに設定されている）
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
            setError(t('messageCannotSelfThread'));
            setIsResolvingThreadId(false);
          }
          isHandlingThreadIdRef.current = false;
          return;
        }

        // selectedThreadIdをユーザーIDとして扱い、既存スレッドを検索
        const threadsResponse = await messageApi.getThreads();

        // アンマウントされている場合は処理を中断
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        // レスポンス形式を統一（配列または { success: true, data: [...] } 形式に対応）
        let threads: any[] = [];
        if (Array.isArray(threadsResponse)) {
          threads = threadsResponse;
        } else if (threadsResponse && typeof threadsResponse === 'object' && 'success' in threadsResponse && 'data' in threadsResponse && (threadsResponse as any).success) {
          threads = Array.isArray((threadsResponse as any).data) ? (threadsResponse as any).data : [];
        }

        // 同じユーザーとの既存スレッドを検索
        const existingThread = threads.find(thread => {
          // participant_idsに指定されたユーザーIDが含まれているかチェック
          // スレッドは通常2人の参加者（自分と相手）を持つ
          return thread.participant_ids && 
                 thread.participant_ids.includes(selectedThreadId) &&
                 thread.participant_ids.length === 2 &&
                 thread.participant_ids.includes(user.id);
        });

        if (existingThread) {
          // アンマウントされている場合は処理を中断
          if (!isMounted) {
            isHandlingThreadIdRef.current = false;
            return;
          }

          // 既存スレッドが見つかった場合、状態を更新（ページ遷移なし）
          // processedThreadIdRefを更新して無限ループを防ぐ
          processedThreadIdRef.current = existingThread.id;
          setSelectedThreadId(existingThread.id);
          setResolvedThreadId(existingThread.id);
          setIsResolvingThreadId(false);
          window.history.replaceState(null, '', `/messages/${existingThread.id}`);
          isHandlingThreadIdRef.current = false;
          return;
        }

        // 既存スレッドがない場合のみ新規作成
        const createResponse = await messageApi.createThread({
          participant_ids: [selectedThreadId],
        });

        // アンマウントされている場合は処理を中断
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        // レスポンス形式を統一（オブジェクトまたは { success: true, data: {...} } 形式に対応）
        let threadData: any = null;
        if (createResponse && typeof createResponse === 'object') {
          if ('id' in createResponse) {
            threadData = createResponse;
          } else if ('success' in createResponse && 'data' in createResponse && (createResponse as any).success) {
            threadData = (createResponse as any).data;
          }
        }

        if (!threadData || !('id' in threadData)) {
          throw new Error(t('messageCreateFailed'));
        }

        // 状態を更新してURLを変更（ページ遷移なし）
        const newThreadId = threadData.id;
        // processedThreadIdRefを更新して無限ループを防ぐ
        processedThreadIdRef.current = newThreadId;
        setSelectedThreadId(newThreadId);
        setResolvedThreadId(newThreadId);
        setIsResolvingThreadId(false);
        window.history.replaceState(null, '', `/messages/${newThreadId}`);
        
        // スレッド一覧を再取得するイベントを発火
        const refreshEvent = new CustomEvent('refreshThreads');
        window.dispatchEvent(refreshEvent);
        
        isHandlingThreadIdRef.current = false;
      } catch (err: any) {
        // アンマウントされている場合はエラーを無視
        if (!isMounted) {
          isHandlingThreadIdRef.current = false;
          return;
        }

        setError(err.message || t('messageFetchFailed'));
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
  }, [selectedThreadId, user, authLoading, resolvedThreadId]);

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

  // MessageThreadContainerからthreadCreatedイベントをリッスン
  useEffect(() => {
    const handleThreadCreated = (event: CustomEvent<{ threadId: string }>) => {
      const newThreadId = event.detail.threadId;
      processedThreadIdRef.current = newThreadId;
      setSelectedThreadId(newThreadId);
      setResolvedThreadId(newThreadId);
      setIsResolvingThreadId(false);
    };

    const handleThreadIdChanged = (event: CustomEvent<{ oldThreadId: string; newThreadId: string }>) => {
      const { oldThreadId, newThreadId } = event.detail;
      processedThreadIdRef.current = newThreadId;
      setSelectedThreadId(newThreadId);
      setResolvedThreadId(newThreadId);
      setIsResolvingThreadId(false);
    };

    window.addEventListener('threadCreated', handleThreadCreated as EventListener);
    window.addEventListener('threadIdChanged', handleThreadIdChanged as EventListener);
    return () => {
      window.removeEventListener('threadCreated', handleThreadCreated as EventListener);
      window.removeEventListener('threadIdChanged', handleThreadIdChanged as EventListener);
    };
  }, []);

  // スマホ画面ではselectedThreadIdでレンダリングを制御、デスクトップでは常に表示
  const isMobileView = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
  const showThreadList = useMemo(() => isMobileView ? !selectedThreadId : true, [isMobileView, selectedThreadId]);
  const showMessageThread = useMemo(() => isMobileView ? !!selectedThreadId : true, [isMobileView, selectedThreadId]);


  // 認証チェック中は何も表示しない（リダイレクト判定中）
  if (authGuardLoading || authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {t('messageCheckingAuth')}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {t('loginRequired')}
          </h1>
          <Link href={`/${locale}/login`} className="text-blue-600 hover:underline">
            {t('messageGoToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex justify-center overflow-hidden" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="w-full max-w-7xl flex overflow-hidden border-l border-r border-gray-200 bg-white">
        {/* スレッド一覧: スマホではselectedThreadIdがない時のみ表示、デスクトップでは常に表示 */}
        <div className={`w-full h-full ${showThreadList ? 'block' : 'hidden'} md:block md:w-auto`}>
          <ThreadListContainer
            onThreadSelect={handleThreadSelect}
            currentThreadId={selectedThreadId}
          />
        </div>

        {/* メッセージスレッド: スマホではselectedThreadIdがある時のみ表示、デスクトップでは常に表示 */}
        <div className={`w-full h-full ${showMessageThread ? 'block' : 'hidden'} md:block md:flex-1`}>
        {isResolvingThreadId && !resolvedThreadId ? (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">
                {t('messageLoadingThread')}
              </p>
            </div>
          </div>
        ) : resolvedThreadId ? (
          <MessageThreadContainer
            threadId={resolvedThreadId}
            onBack={handleBackToThreads}
            initialData={initialData}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="font-bold text-lg" style={{ color: '#9ca3af' }}>
                {t('messageSelectThread')}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
