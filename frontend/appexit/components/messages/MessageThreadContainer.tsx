'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { messageApi, MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { getImageUrls } from '@/lib/storage';
import MessageThread from './MessageThread';

interface MessageThreadContainerProps {
  threadId: string | undefined;
  onBack?: () => void;
}

function MessageThreadContainer({ threadId, onBack }: MessageThreadContainerProps) {
  const { user } = useAuth();
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevThreadIdRef = useRef<string | undefined>(undefined);

  // threadIdが変わった時のみデータを取得
  useEffect(() => {
    // マウント状態を追跡
    let isMounted = true;
    const abortController = new AbortController();

    const fetchThreadData = async () => {
      if (!threadId || !user) {
        if (isMounted) {
          setThreadDetail(null);
          setMessages([]);
          setIsLoadingMessages(false);
        }
        return;
      }

      // 同じthreadIdの場合はスキップ
      if (prevThreadIdRef.current === threadId) {
        return;
      }

      prevThreadIdRef.current = threadId;

      try {
        if (isMounted) {
          setIsLoadingMessages(true);
        }

        // スレッド詳細とメッセージ一覧を並行取得
        const [detailResponse, messagesResponse] = await Promise.all([
          messageApi.getThread(threadId),
          messageApi.getMessages(threadId),
        ]);

        // アンマウントされている場合は処理を中断
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        // スレッド詳細の処理
        if (detailResponse && typeof detailResponse === 'object') {
          if ('success' in detailResponse && 'data' in detailResponse && detailResponse.success) {
            setThreadDetail(detailResponse.data);
          } else if ('id' in detailResponse) {
            // 直接ThreadDetailオブジェクトの場合
            setThreadDetail(detailResponse as ThreadDetail);
          }
        }

        // メッセージ一覧の処理
        let messages: MessageWithSender[] = [];
        if (messagesResponse && Array.isArray(messagesResponse)) {
          messages = messagesResponse;
        } else if (messagesResponse && typeof messagesResponse === 'object' && 'success' in messagesResponse && 'data' in messagesResponse) {
          if (messagesResponse.success && Array.isArray(messagesResponse.data)) {
            messages = messagesResponse.data;
          }
        }

        console.log('[MESSAGE-THREAD] Messages received:', messages);

        // 画像パスを収集
        const imagePaths = messages
          .map(msg => msg.image_url)
          .filter((path): path is string => !!path);

        if (imagePaths.length > 0) {
          const imageUrlMap = await getImageUrls(imagePaths);

          // アンマウントされている場合は処理を中断
          if (!isMounted || abortController.signal.aborted) {
            return;
          }

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

        setError(null);
      } catch (err) {
        // アンマウントされている場合はエラーを無視
        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        console.error('Failed to fetch thread data:', err);

        // 404エラーの場合は特別な処理
        if ((err as any)?.status === 404) {
          setError('このスレッドは存在しないか、削除されました');
          setMessages([]);
          setThreadDetail(null);

          // 3秒後にメッセージ一覧にリダイレクト
          if (onBack) {
            setTimeout(() => {
              if (isMounted) {
                onBack();
              }
            }, 2000);
          }
        } else {
          setError('メッセージの取得に失敗しました');
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    fetchThreadData();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [threadId, user, onBack]);

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
          console.error('Failed to upload image:', uploadErr);
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
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && response.success) {
          sentMessage = response.data;
        } else if ('id' in response) {
          // 直接MessageWithSenderオブジェクトの場合
          sentMessage = response as MessageWithSender;
        }
      }

      if (sentMessage) {
        let signedImageUrl = sentMessage.image_url;
        if (sentMessage.image_url) {
          const imageUrlMap = await getImageUrls([sentMessage.image_url]);
          signedImageUrl = imageUrlMap.get(sentMessage.image_url) || sentMessage.image_url;
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
      console.error('Failed to send message:', err);
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
    />
  );
}

export default memo(MessageThreadContainer);
