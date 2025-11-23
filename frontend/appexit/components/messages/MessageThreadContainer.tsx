'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageApi, MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { getImageUrls } from '@/lib/storage';
import MessageThread from './MessageThread';

interface ThreadAndMessagesData {
  thread: any | null;
  messages: any[];
}

interface MessageThreadContainerProps {
  threadId: string | undefined;
  onBack?: () => void;
  initialData?: ThreadAndMessagesData | null;
}

function MessageThreadContainer({ threadId, onBack, initialData }: MessageThreadContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const prevThreadIdRef = useRef<string | undefined>(undefined);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MESSAGES_PER_PAGE = 50;

  // threadIdが変わった時のみデータを取得
  useEffect(() => {
    const abortController = new AbortController();
    const currentThreadId = threadId; // クロージャでthreadIdを保持

    const fetchThreadData = async () => {
      if (!currentThreadId || !user) {
        setThreadDetail(null);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      // 同じthreadIdの場合はスキップ
      if (prevThreadIdRef.current === currentThreadId) {
        // 読み込み状態が残っている場合はリセット
        setIsLoadingMessages(false);
        return;
      }

      prevThreadIdRef.current = currentThreadId;

      try {
        setIsLoadingMessages(true);
        setError(null);

        // 自分自身のIDの場合はスレッド詳細を取得しない（受信トレイ表示）
        if (currentThreadId === user.id) {
          setThreadDetail(null);
          setMessages([]);
          setIsLoadingMessages(false);
          return;
        }

        let data;

        // initialDataが利用可能な場合はそれを使用、そうでなければBFFから取得
        if (initialData && initialData.thread && initialData.thread.id === currentThreadId) {
          data = initialData;
        } else {
          // クライアントサイドでBFFから取得（Nginx経由で /bff/ にアクセス）
          // 本番環境: https://appexit.jp/bff/...
          // 開発環境: http://localhost:8082/bff/...
          const bffUrl = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8082';
          const response = await fetch(
            `${bffUrl}/bff/thread-and-messages?thread_id=${currentThreadId}&limit=${MESSAGES_PER_PAGE}&offset=0`,
            {
              credentials: 'include' // 🔥 Cookieを送信するために必須
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch thread and messages');
          }

          data = await response.json();
        }

        // threadIdが変更された場合は処理を中断（新しいリクエストが開始された）
        if (prevThreadIdRef.current !== currentThreadId) {
          return;
        }

        // スレッド詳細の処理
        if (data.thread && typeof data.thread === 'object' && 'id' in data.thread) {
          const responseThreadId = (data.thread as ThreadDetail).id;

          // デバッグログ: スレッド詳細のデータ構造を確認
          console.log('[MessageThreadContainer] Thread detail received:', {
            id: responseThreadId,
            participants: (data.thread as ThreadDetail).participants,
            participantCount: (data.thread as ThreadDetail).participants?.length || 0,
          });

          // 取得したスレッドIDが現在のthreadIdと一致するかチェック
          if (responseThreadId !== currentThreadId) {
            // バックエンドが別のスレッドIDを返した場合（既存スレッドが見つかった場合）
            // URLとprevThreadIdRefを更新
            window.history.replaceState(null, '', `/messages/${responseThreadId}`);

            // カスタムイベントを発火して親コンポーネントに通知
            const event = new CustomEvent('threadIdChanged', {
              detail: { oldThreadId: currentThreadId, newThreadId: responseThreadId }
            });
            window.dispatchEvent(event);

            // prevThreadIdRefをリセットして、新しいthreadIdで再取得を促す
            prevThreadIdRef.current = undefined;
            return; // 現在の処理を中断して再取得
          }

          setThreadDetail(data.thread as ThreadDetail);
        }

        // メッセージ一覧の処理 - 空配列も許容
        let messages: MessageWithSender[] = [];
        if (data.messages && Array.isArray(data.messages)) {
          messages = data.messages;
        }

        // threadIdが変更された場合は処理を中断
        if (prevThreadIdRef.current !== currentThreadId) {
          return;
        }

        // まずメッセージを即座に表示（画像URLの取得を待たない）
        // メッセージが空の場合でも空配列として設定し、読み込み状態を解除する
        // コンポーネントが再マウントされていても、threadIdが一致していれば表示する
        setMessages(messages);
        setError(null);
        setHasMoreMessages(messages.length >= MESSAGES_PER_PAGE);

        // 画像パスを収集
        const imagePaths = messages
          .map(msg => msg.image_url)
          .filter((path): path is string => !!path);

        // 画像URLの取得は非同期で実行（読み込み状態をブロックしない）
        if (imagePaths.length > 0) {
          // タイムアウトを10秒に設定
          const imageUrlPromise = getImageUrls(imagePaths);
          const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
            setTimeout(() => {
              resolve(new Map());
            }, 10000);
          });

          Promise.race([
            imageUrlPromise.catch(() => {
              return new Map<string, string>();
            }),
            timeoutPromise,
          ]).then((imageUrlMap) => {
            // threadIdが変更された場合は処理を中断
            if (prevThreadIdRef.current !== currentThreadId) {
              return;
            }

            // 画像URLを更新
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
          }).catch(() => {
          });
        }
      } catch (err) {
        // threadIdが変更された場合はエラーを無視
        if (prevThreadIdRef.current !== currentThreadId) {
          return;
        }

        // 404エラーの場合は特別な処理
        if ((err as any)?.status === 404) {
          // URLパラメータから相手のユーザーIDを取得してthreadを作成
          const urlParams = new URLSearchParams(window.location.search);
          const otherUserId = urlParams.get('user_id');

          if (otherUserId && otherUserId !== user.id) {
            // 相手のユーザーIDが指定されている場合、新しいthreadを作成
            try {
              const createResponse = await messageApi.createThread({
                participant_ids: [otherUserId],
              });

              if (createResponse && typeof createResponse === 'object' && 'id' in createResponse) {
                const newThreadId = createResponse.id;
                // URLを更新して新しいthreadを表示
                window.history.replaceState(null, '', `/messages/${newThreadId}`);
                // カスタムイベントを発火して親コンポーネントに通知
                const event = new CustomEvent('threadCreated', {
                  detail: { threadId: newThreadId }
                });
                window.dispatchEvent(event);
                // 新しいthreadのデータを取得
                prevThreadIdRef.current = undefined; // リセットして再取得を促す
                return;
              }
            } catch (createErr) {
            }
          }

          // threadを作成できない場合、エラーメッセージを表示
          setError('このスレッドは存在しないか、削除されました');
          setMessages([]);
          setThreadDetail(null);

          // 2秒後にメッセージ一覧にリダイレクト
          if (onBack) {
            if (redirectTimeoutRef.current) {
              clearTimeout(redirectTimeoutRef.current);
            }
            redirectTimeoutRef.current = setTimeout(() => {
              onBack();
              redirectTimeoutRef.current = null;
            }, 2000);
          }
        } else {
          setError('メッセージの取得に失敗しました');
          setMessages([]);
        }
      } finally {
        // エラーが発生した場合でも、確実に読み込み状態を解除
        // threadIdが変更されていない場合のみ状態を更新
        if (prevThreadIdRef.current === currentThreadId) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchThreadData();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      abortController.abort();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [threadId, user, initialData]);

  // 古いメッセージを読み込む
  const loadMoreMessages = useCallback(async () => {
    if (!threadId || isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const olderMessages = await messageApi.getMessages(threadId, {
        limit: MESSAGES_PER_PAGE,
        offset: messages.length,
      });

      if (Array.isArray(olderMessages) && olderMessages.length > 0) {
        // 古いメッセージを先頭に追加（時系列順を保つ）
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMoreMessages(olderMessages.length >= MESSAGES_PER_PAGE);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      setHasMoreMessages(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [threadId, isLoadingMore, hasMoreMessages, messages.length, MESSAGES_PER_PAGE]);

  const handleSendMessage = useCallback(async (messageText: string, imageFile?: File | null) => {
    if ((!messageText.trim() && !imageFile) || !threadId || isSending || !user) return;

    const tempId = `temp-${Date.now()}`;

    // 楽観的UI: メッセージを即座に表示
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      thread_id: threadId,
      sender_id: user.id,
      sender_user_id: user.id,
      type: imageFile ? 'image' : 'text',
      content: messageText,
      text: messageText,
      image_url: imageFile ? URL.createObjectURL(imageFile) : undefined,
      sender: {
        id: user.id,
        display_name: user.name || 'あなた',
        icon_url: undefined,
      },
      created_at: new Date().toISOString(),
    } as any;

    setMessages(prev => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile && user) {
        try {
          const uploadResponse = await messageApi.uploadMessageImage(imageFile);
          if (uploadResponse.success && uploadResponse.data) {
            imageUrl = uploadResponse.data.file_path;
          }
        } catch (uploadErr) {
          setError('画像のアップロードに失敗しました');
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setIsSending(false);
          throw uploadErr;
        }
      }

      const response = await messageApi.sendMessage({
        thread_id: threadId,
        type: imageFile ? 'image' : 'text',
        text: messageText ? messageText : undefined,
        file_url: imageUrl ? imageUrl : undefined,
      });

      let sentMessage: MessageWithSender | null = null;
      if (response && typeof response === 'object' && 'id' in response) {
        sentMessage = response as MessageWithSender;
      }

      if (sentMessage) {
        // バックエンドから既にsigned URLが返されている場合はそのまま使用
        // signed URLでない場合（ファイルパスの場合）のみ、signed URLを取得
        let signedImageUrl = sentMessage.image_url;
        if (sentMessage.image_url && !sentMessage.image_url.startsWith('http://') && !sentMessage.image_url.startsWith('https://')) {
          // ファイルパスの場合のみsigned URLを取得
          try {
            const imageUrlMap = await getImageUrls([sentMessage.image_url]);
            signedImageUrl = imageUrlMap.get(sentMessage.image_url) || sentMessage.image_url;
          } catch (err) {
            // エラーが発生しても元のURLを使用
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  ...sentMessage!,
                  image_url: signedImageUrl,
                  sender_name: user.name || 'あなた',
                  sender_icon_url: null,
                  is_sending: false,
                }
              : msg
          )
        );

        // スレッド一覧の最終メッセージを更新（カスタムイベントを発火）
        const event = new CustomEvent('updateThreadLastMessage', {
          detail: { threadId, lastMessage: sentMessage }
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      setError('メッセージの送信に失敗しました');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [threadId, isSending, user]);


  if (!user) return null;

  return (
    <MessageThread
      threadDetail={threadDetail}
      messages={messages}
      currentUserId={user.id}
      onSendMessage={handleSendMessage}
      isSending={isSending}
      isLoadingMessages={isLoadingMessages}
      onBack={onBack}
      onLoadMore={loadMoreMessages}
      hasMoreMessages={hasMoreMessages}
      isLoadingMore={isLoadingMore}
    />
  );
}

export default memo(MessageThreadContainer);
