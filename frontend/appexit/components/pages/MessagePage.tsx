'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageApi, ThreadWithLastMessage, MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { getImageUrls } from '@/lib/storage';
import Link from 'next/link';
import ThreadList from '@/components/messages/ThreadList';
import MessageThread from '@/components/messages/MessageThread';

interface MessagePageProps {
  threadId?: string;
}

export default function MessagePage({ threadId }: MessagePageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ThreadWithLastMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadWithLastMessage | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isHandlingThreadIdRef = useRef(false);
  const threadsRef = useRef<ThreadWithLastMessage[]>([]);
  const processedThreadIdRef = useRef<string | null>(null);
  const selectedThreadIdRef = useRef<string | null>(null);
  const userInitiatedSelectionRef = useRef(false);

  // threadsRefをthreadsと同期
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  // threadIdが変更されたときにprocessedThreadIdRefとselectedThreadIdRefをリセット
  useEffect(() => {
    processedThreadIdRef.current = null;
    selectedThreadIdRef.current = null;
    // threadIdがundefinedになった場合（/messagesに戻った場合）、selectedThreadをクリア
    // スマホ画面では常にクリア（デスクトップではサイドバーがあるので維持）
    if (!threadId) {
      // スマホ画面かどうかを判定（window.innerWidth < 768）
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSelectedThread(null);
        setThreadDetail(null);
        setMessages([]);
      }
      userInitiatedSelectionRef.current = false;
    }
  }, [threadId]);

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

  // threadIdが指定されている場合、該当するスレッドを選択または作成
  useEffect(() => {
    const handleThreadId = async () => {
      if (!threadId || !user || authLoading) return;

      // 処理中の場合はスキップ（重複実行を防ぐ）
      if (isHandlingThreadIdRef.current) {
        console.log('[MESSAGE-PAGE] Already handling thread ID, skipping');
        return;
      }

      // 既に処理済みのthreadIdの場合はスキップ
      if (processedThreadIdRef.current === threadId) {
        console.log('[MESSAGE-PAGE] Thread ID already processed, skipping');
        // selectedThreadが既に設定されている場合は維持
        if (selectedThread?.id === threadId) {
          userInitiatedSelectionRef.current = false;
          return;
        }
          // スレッドが選択されていない場合は、スレッド一覧から検索
          if (selectedThreadIdRef.current !== threadId) {
            const currentThreads = threadsRef.current;
            const thread = currentThreads.find(t => t.id === threadId);
            if (thread) {
              // ユーザーが明示的に選択した場合、またはデスクトップ画面（md以上）では自動選択
              // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
              if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
                setSelectedThread(thread);
              } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSelectedThread(thread);
              }
              selectedThreadIdRef.current = threadId;
              userInitiatedSelectionRef.current = false;
            }
          } else {
            // selectedThreadIdRefがthreadIdと一致している場合、selectedThreadも確認
            const currentThreads = threadsRef.current;
            const thread = currentThreads.find(t => t.id === threadId);
            if (thread) {
              // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
              if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
                setSelectedThread(thread);
              } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSelectedThread(thread);
              }
            }
            userInitiatedSelectionRef.current = false;
          }
        return;
      }

      // スレッド一覧のロードが完了するまで待つ（初回ロード中はスキップ）
      // threadsが空でない場合はロード完了とみなす
      if (isLoadingThreads && threadsRef.current.length === 0) {
        console.log('[MESSAGE-PAGE] Threads still loading, waiting...');
        return;
      }

      isHandlingThreadIdRef.current = true;
      console.log('[MESSAGE-PAGE] Starting to handle thread ID:', threadId);

      try {
        // 自分自身とのスレッド作成を防ぐ
        if (threadId === user.id) {
          setError('自分自身とのメッセージスレッドは作成できません');
          processedThreadIdRef.current = threadId; // 処理済みとしてマークして再実行を防ぐ
          isHandlingThreadIdRef.current = false;
          return;
        }

        const currentThreads = threadsRef.current;

        // まずスレッド一覧から検索（スレッドIDとして）
        let thread = currentThreads.find(t => t.id === threadId);

        if (thread) {
          // スレッドIDとして見つかった
          console.log('[MESSAGE-PAGE] Found existing thread by ID:', thread.id);
          // ユーザーが明示的に選択した場合、またはデスクトップ画面（md以上）では自動選択
          // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定（レンダリング用）
          if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
            setSelectedThread(thread);
          } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
            // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
            setSelectedThread(thread);
          }
          selectedThreadIdRef.current = threadId;
          processedThreadIdRef.current = threadId;
          isHandlingThreadIdRef.current = false;
          userInitiatedSelectionRef.current = false;
          return;
        }

        // ユーザーIDとして解釈してスレッドを検索（既存の1対1スレッド）
        thread = currentThreads.find(t =>
          t.participant_ids.includes(threadId) &&
          t.participant_ids.length === 2 &&
          t.participant_ids.includes(user.id)
        );

        if (thread) {
          console.log('[MESSAGE-PAGE] Found existing 1-on-1 thread:', thread.id);
          // ユーザーが明示的に選択した場合、またはデスクトップ画面（md以上）では自動選択
          // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
          if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
            setSelectedThread(thread);
          } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setSelectedThread(thread);
          }
          selectedThreadIdRef.current = thread.id;
          processedThreadIdRef.current = threadId;
          // URLを実際のスレッドIDに変更
          router.replace(`/messages/${thread.id}`);
          isHandlingThreadIdRef.current = false;
          userInitiatedSelectionRef.current = false;
          return;
        }

        // スレッド一覧にない場合、スレッドIDとして直接取得を試みる
        try {
          const threadDetailResponse = await messageApi.getThread(threadId);
          if (threadDetailResponse.success && threadDetailResponse.data) {
            // スレッド詳細から ThreadWithLastMessage を作成
            const foundThread: ThreadWithLastMessage = {
              id: threadDetailResponse.data.id,
              created_by: threadDetailResponse.data.created_by,
              related_post_id: threadDetailResponse.data.related_post_id,
              created_at: threadDetailResponse.data.created_at,
              participant_ids: threadDetailResponse.data.participants.map(p => p.id),
              last_message: null,
              unread_count: 0,
            };
            setThreads(prev => {
              // 既に存在する場合は追加しない
              if (prev.find(t => t.id === foundThread.id)) {
                return prev;
              }
              return [...prev, foundThread];
            });
            // ユーザーが明示的に選択した場合、またはデスクトップ画面（md以上）では自動選択
            // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
            if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
              setSelectedThread(foundThread);
              setThreadDetail(threadDetailResponse.data);
            } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setSelectedThread(foundThread);
              setThreadDetail(threadDetailResponse.data);
            }
            selectedThreadIdRef.current = foundThread.id;
            processedThreadIdRef.current = threadId;
            isHandlingThreadIdRef.current = false;
            userInitiatedSelectionRef.current = false;
            return;
          }
        } catch (threadErr: any) {
          // 404エラー（スレッドが見つからない）の場合は正常なフローとして扱う
          // ユーザーIDとして新規スレッドを作成する
          if ((threadErr as any)?.status === 404) {
            console.log('[MESSAGE-PAGE] Thread not found by ID, will attempt to create new thread with user ID:', threadId);
          } else {
            // 404以外のエラーはコンソールに記録（ただしエラーメッセージは表示しない）
            console.log('[MESSAGE-PAGE] Failed to get thread, will attempt to create new thread:', threadErr.message);
          }
        }

        // 新規スレッドを作成（threadIdをユーザーIDとして）
        console.log('Creating new thread with participant:', threadId);
        try {
          const createResponse = await messageApi.createThread({
            participant_ids: [threadId],
          });

          if (!createResponse.success) {
            throw new Error('スレッドの作成に失敗しました');
          }

          if (!createResponse.data) {
            throw new Error('スレッドデータの取得に失敗しました');
          }

          console.log('Thread created successfully:', createResponse.data.id);

          // 作成したスレッドの詳細を取得
          const threadDetailResponse = await messageApi.getThread(createResponse.data.id);
          if (!threadDetailResponse.success) {
            throw new Error('スレッド詳細の取得に失敗しました');
          }

          if (!threadDetailResponse.data) {
            throw new Error('スレッド詳細データの取得に失敗しました');
          }

          const newThread: ThreadWithLastMessage = {
            ...createResponse.data,
            participant_ids: threadDetailResponse.data.participants.map(p => p.id),
            last_message: null,
            unread_count: 0,
          };

          setThreads(prev => {
            // 既に存在する場合は追加しない
            if (prev.find(t => t.id === newThread.id)) {
              return prev;
            }
            return [...prev, newThread];
          });
            // ユーザーが明示的に選択した場合、またはデスクトップ画面（md以上）では自動選択
            // スマホ画面でも、threadIdが存在する場合はselectedThreadを設定
            if (userInitiatedSelectionRef.current || (typeof window !== 'undefined' && window.innerWidth >= 768)) {
              setSelectedThread(newThread);
              setThreadDetail(threadDetailResponse.data);
            } else if (typeof window !== 'undefined' && window.innerWidth < 768) {
              setSelectedThread(newThread);
              setThreadDetail(threadDetailResponse.data);
            }
            selectedThreadIdRef.current = newThread.id;

          // URLをスレッドIDに変更
          router.replace(`/messages/${newThread.id}`);
          console.log('Thread setup complete, redirected to:', `/messages/${newThread.id}`);
          processedThreadIdRef.current = threadId;
          isHandlingThreadIdRef.current = false;
          userInitiatedSelectionRef.current = false;
        } catch (createErr: any) {
          console.error('Failed to create thread:', createErr);
          setError(`スレッドの作成に失敗しました: ${createErr.message}`);
          isHandlingThreadIdRef.current = false;
        }
      } catch (err: any) {
        // 404エラーは正常なフロー（スレッド作成に進む）なので、エラーメッセージを表示しない
        if ((err as any)?.status === 404) {
          console.log('[MESSAGE-PAGE] Thread not found, this is expected when creating new thread');
          isHandlingThreadIdRef.current = false;
          return;
        }
        console.error('Failed to handle thread ID:', err);
        const errorMessage = err.message || 'スレッドの取得に失敗しました';
        setError(errorMessage);
        processedThreadIdRef.current = threadId; // エラーでも処理済みとしてマーク
        isHandlingThreadIdRef.current = false;
      }
    };

    handleThreadId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, user?.id, authLoading, isLoadingThreads]);

  // 選択されたスレッドの詳細とメッセージを並行取得
  useEffect(() => {
    const fetchThreadData = async () => {
      if (!selectedThread) {
        setThreadDetail(null);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      try {
        setIsLoadingMessages(true);
        // スレッド詳細とメッセージ一覧を並行取得
        const [detailResponse, messagesResponse] = await Promise.all([
          messageApi.getThread(selectedThread.id),
          messageApi.getMessages(selectedThread.id),
        ]);

        if (detailResponse.success && detailResponse.data) {
          setThreadDetail(detailResponse.data);
        }

        if (messagesResponse.success) {
          // メッセージがない場合（空配列）も正常な状態として扱う
          const messages = messagesResponse.data || [];

          // 画像パスを収集
          const imagePaths = messages
            .map(msg => msg.image_url)
            .filter((path): path is string => !!path);

          if (imagePaths.length > 0) {
            // 署名付きURLを取得
            const imageUrlMap = await getImageUrls(imagePaths);

            // メッセージに署名付きURLを追加
            const messagesWithSignedUrls = messages.map(msg => {
              if (msg.image_url) {
                return {
                  ...msg,
                  image_url: imageUrlMap.get(msg.image_url) || msg.image_url,
                };
              }
              return msg;
            });

            setMessages(messagesWithSignedUrls);
          } else {
            setMessages(messages);
          }

          setError(null); // 成功時はエラーをクリア
        } else {
          // successがfalseの場合、メッセージがない場合として扱う（エラーではない）
          setMessages([]);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch thread data:', err);
        // エラーが発生した場合のみエラーメッセージを表示
        setError('メッセージの取得に失敗しました');
        // エラー時もメッセージリストを空にする（UIが壊れないように）
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchThreadData();
  }, [selectedThread]);

  const handleThreadSelect = useCallback((thread: ThreadWithLastMessage) => {
    // ユーザーが明示的に選択したことをマーク
    userInitiatedSelectionRef.current = true;
    // 即座にselectedThreadを設定
    setSelectedThread(thread);
    selectedThreadIdRef.current = thread.id;
    // processedThreadIdRefも設定して、threadIdのuseEffectでの再処理を防ぐ
    processedThreadIdRef.current = thread.id;
    // URLを更新（スマホではreplace、デスクトップではpush）
    // URL変更によりthreadIdが更新され、レンダリングが即座に反映される
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.replace(`/messages/${thread.id}`);
    } else {
      router.push(`/messages/${thread.id}`);
    }
  }, [router]);

  const handleBackToThreads = useCallback(() => {
    // 状態をクリア
    setSelectedThread(null);
    setThreadDetail(null);
    setMessages([]);
    selectedThreadIdRef.current = null;
    processedThreadIdRef.current = null;
    // URLを/messagesに変更
    router.replace('/messages');
  }, [router]);

  const handleSendMessage = async (messageText: string, imageFile?: File | null) => {
    if ((!messageText.trim() && !imageFile) || !selectedThread || isSending) return;

    const tempId = `temp-${Date.now()}`;

    // 楽観的UI: メッセージを即座に表示
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      thread_id: selectedThread.id,
      sender_user_id: user?.id || '',
      type: imageFile ? 'image' : 'text',
      text: messageText,
      image_url: imageFile ? URL.createObjectURL(imageFile) : undefined,
      sender_name: user?.name || 'あなた',
      sender_icon_url: null,
      created_at: new Date().toISOString(),
      is_sending: true,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      let imageUrl: string | null = null;

      // 画像がある場合はバックエンドのアップロードAPIを使用
      if (imageFile && user) {
        try {
          const uploadResponse = await messageApi.uploadMessageImage(imageFile);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.file_path;
          }
        } catch (uploadErr) {
          console.error('Failed to upload image:', uploadErr);
          setError('画像のアップロードに失敗しました');
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setIsSending(false);
          throw uploadErr;
        }
      }

      const response = await messageApi.sendMessage({
        thread_id: selectedThread.id,
        type: imageFile ? 'image' : 'text',
        text: messageText ? messageText : undefined,
        file_url: imageUrl ? imageUrl : undefined,
      });

      if (response.success && response.data) {
        // 画像がある場合は署名付きURLを取得
        let signedImageUrl = response.data.image_url;
        if (response.data.image_url) {
          const imageUrlMap = await getImageUrls([response.data.image_url]);
          signedImageUrl = imageUrlMap.get(response.data.image_url) || response.data.image_url;
        }

        // 実際のレスポンスで一時メッセージを置き換え
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  ...response.data,
                  image_url: signedImageUrl,
                  sender_name: user?.name || 'あなた',
                  sender_icon_url: null,
                  is_sending: false,
                }
              : msg
          )
        );

        // スレッド一覧を更新
        const updatedThreads = threads.map(t =>
          t.id === selectedThread.id
            ? { ...t, last_message: response.data }
            : t
        );
        setThreads(updatedThreads);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('メッセージの送信に失敗しました');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw err; // エラーを再スロー
    } finally {
      setIsSending(false);
    }
  };


  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  // スマホ画面ではthreadIdでレンダリングを制御、デスクトップではselectedThreadで制御
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const showThreadList = isMobileView ? !threadId : true;
  const showMessageThread = isMobileView ? !!threadId : true;

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden" style={{ backgroundColor: '#F9F8F7' }}>
      {/* スレッド一覧: スマホではthreadIdがない時のみ表示、デスクトップでは常に表示 */}
      <div className={`w-full h-full ${showThreadList ? 'block' : 'hidden'} md:block md:w-auto`}>
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThread?.id || threadId}
          currentUserId={user.id}
          onThreadSelect={handleThreadSelect}
          error={error}
          onErrorDismiss={() => setError(null)}
          isLoading={isLoadingThreads}
        />
      </div>
      
      {/* メッセージスレッド: スマホではthreadIdがある時のみ表示、デスクトップでは常に表示 */}
      <div className={`w-full h-full ${showMessageThread ? 'block' : 'hidden'} md:block md:flex-1`}>
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center h-full" style={{ backgroundColor: '#F9F8F7' }}>
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
            </div>
          </div>
        ) : (
          <MessageThread
            threadDetail={threadDetail}
            messages={messages}
            currentUserId={user.id}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            onBack={handleBackToThreads}
          />
        )}
      </div>
    </div>
  );
}
