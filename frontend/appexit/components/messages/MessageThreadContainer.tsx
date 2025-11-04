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
    const fetchThreadData = async () => {
      if (!threadId || !user) {
        setThreadDetail(null);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      // 同じthreadIdの場合はスキップ
      if (prevThreadIdRef.current === threadId) {
        return;
      }

      prevThreadIdRef.current = threadId;

      try {
        setIsLoadingMessages(true);
        // スレッド詳細とメッセージ一覧を並行取得
        const [detailResponse, messagesResponse] = await Promise.all([
          messageApi.getThread(threadId),
          messageApi.getMessages(threadId),
        ]);

        if (detailResponse.success && detailResponse.data) {
          setThreadDetail(detailResponse.data);
        }

        if (messagesResponse.success) {
          const messages = messagesResponse.data || [];

          // 画像パスを収集
          const imagePaths = messages
            .map(msg => msg.image_url)
            .filter((path): path is string => !!path);

          if (imagePaths.length > 0) {
            const imageUrlMap = await getImageUrls(imagePaths);
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
        } else {
          setMessages([]);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch thread data:', err);

        // 404エラーの場合は特別な処理
        if ((err as any)?.status === 404) {
          setError('このスレッドは存在しないか、削除されました');
          setMessages([]);
          setThreadDetail(null);

          // 3秒後にメッセージ一覧にリダイレクト
          if (onBack) {
            setTimeout(() => {
              onBack();
            }, 2000);
          }
        } else {
          setError('メッセージの取得に失敗しました');
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchThreadData();
  }, [threadId, user, onBack]);

  const handleSendMessage = useCallback(async (messageText: string, imageFile?: File | null) => {
    if ((!messageText.trim() && !imageFile) || !threadId || isSending || !user) return;

    const tempId = `temp-${Date.now()}`;

    // 楽観的UI: メッセージを即座に表示
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      thread_id: threadId,
      sender_user_id: user.id,
      type: imageFile ? 'image' : 'text',
      text: messageText,
      image_url: imageFile ? URL.createObjectURL(imageFile) : undefined,
      sender_name: user.name || 'あなた',
      sender_icon_url: null,
      created_at: new Date().toISOString(),
      is_sending: true,
    };

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

      if (response.success && response.data) {
        let signedImageUrl = response.data.image_url;
        if (response.data.image_url) {
          const imageUrlMap = await getImageUrls([response.data.image_url]);
          signedImageUrl = imageUrlMap.get(response.data.image_url) || response.data.image_url;
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  ...response.data,
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
          detail: { threadId, lastMessage: response.data }
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
