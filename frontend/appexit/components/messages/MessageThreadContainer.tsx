'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messageApi, MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { getImageUrls } from '@/lib/storage';
import MessageThread from './MessageThread';

interface MessageThreadContainerProps {
  threadId: string | undefined;
  onBack?: () => void;
}

function MessageThreadContainer({ threadId, onBack }: MessageThreadContainerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevThreadIdRef = useRef<string | undefined>(undefined);

  // threadIdが変わった時のみデータを取得
  useEffect(() => {
    const abortController = new AbortController();
    const currentThreadId = threadId; // クロージャでthreadIdを保持

    const fetchThreadData = async () => {
      console.log('[MESSAGE-THREAD] fetchThreadData called', { threadId: currentThreadId, userId: user?.id, prevThreadId: prevThreadIdRef.current });
      
      if (!currentThreadId || !user) {
        console.log('[MESSAGE-THREAD] Early return: no threadId or user');
        setThreadDetail(null);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      // 同じthreadIdの場合はスキップ
      if (prevThreadIdRef.current === currentThreadId) {
        console.log('[MESSAGE-THREAD] Early return: same threadId, skipping fetch');
        // 読み込み状態が残っている場合はリセット
        setIsLoadingMessages(false);
        return;
      }

      prevThreadIdRef.current = currentThreadId;

      try {
        console.log('[MESSAGE-THREAD] Starting fetch, setting isLoadingMessages to true');
        setIsLoadingMessages(true);
        setError(null);

        // スレッド詳細とメッセージ一覧を並行取得
        console.log('[MESSAGE-THREAD] Starting Promise.all for API calls, threadId:', currentThreadId);
        const [detailResponse, messagesResponse] = await Promise.all([
          messageApi.getThread(currentThreadId),
          messageApi.getMessages(currentThreadId),
        ]);

        console.log('[MESSAGE-THREAD] Promise.all completed', {
          detailResponse: detailResponse ? 'exists' : 'null',
          messagesResponse: messagesResponse ? 'exists' : 'null',
          messagesResponseType: typeof messagesResponse,
          isArray: Array.isArray(messagesResponse),
          aborted: abortController.signal.aborted,
          currentThreadId,
          prevThreadId: prevThreadIdRef.current
        });

        // threadIdが変更された場合は処理を中断（新しいリクエストが開始された）
        if (prevThreadIdRef.current !== currentThreadId) {
          console.log('[MESSAGE-THREAD] ThreadId changed during fetch, aborting old request');
          return;
        }

        // スレッド詳細の処理
        if (detailResponse && typeof detailResponse === 'object' && 'id' in detailResponse) {
          const responseThreadId = (detailResponse as ThreadDetail).id;
          console.log('[MESSAGE-THREAD] Setting threadDetail:', responseThreadId);

          // 取得したスレッドIDが現在のthreadIdと一致するかチェック
          if (responseThreadId !== currentThreadId) {
            console.warn('[MESSAGE-THREAD] Thread ID mismatch, will fetch correct thread', {
              expected: currentThreadId,
              received: responseThreadId
            });
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

          setThreadDetail(detailResponse as ThreadDetail);
        } else {
          console.log('[MESSAGE-THREAD] No valid threadDetail found');
        }

        // メッセージ一覧の処理 - 空配列も許容
        let messages: MessageWithSender[] = [];
        if (messagesResponse && Array.isArray(messagesResponse)) {
          messages = messagesResponse;
          console.log('[MESSAGE-THREAD] Messages is array, length:', messages.length);
        } else if (messagesResponse && typeof messagesResponse === 'object' && 'data' in messagesResponse && Array.isArray((messagesResponse as any).data)) {
          messages = (messagesResponse as any).data;
          console.log('[MESSAGE-THREAD] Messages in data property, length:', messages.length);
        } else {
          console.log('[MESSAGE-THREAD] Messages response format not recognized:', messagesResponse);
        }

        console.log('[MESSAGE-THREAD] Messages received:', messages, 'length:', messages.length);
        if (messages.length > 0) {
          console.log('[MESSAGE-THREAD] First message:', messages[0]);
        }

        // threadIdが変更された場合は処理を中断
        if (prevThreadIdRef.current !== currentThreadId) {
          console.log('[MESSAGE-THREAD] ThreadId changed before setting messages, aborting');
          return;
        }

        // まずメッセージを即座に表示（画像URLの取得を待たない）
        // メッセージが空の場合でも空配列として設定し、読み込み状態を解除する
        // コンポーネントが再マウントされていても、threadIdが一致していれば表示する
        setMessages(messages);
        setError(null);
        console.log('[MESSAGE-THREAD] Messages set (empty array is OK):', messages.length);

        // 画像パスを収集
        const imagePaths = messages
          .map(msg => msg.image_url)
          .filter((path): path is string => !!path);

        // 画像URLの取得は非同期で実行（読み込み状態をブロックしない）
        if (imagePaths.length > 0) {
          console.log('[MESSAGE-THREAD] Fetching image URLs for paths:', imagePaths);
          // タイムアウトを10秒に設定
          const imageUrlPromise = getImageUrls(imagePaths);
          const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
            setTimeout(() => {
              console.warn('[MESSAGE-THREAD] getImageUrls timeout after 10s, using empty map');
              resolve(new Map());
            }, 10000);
          });

          Promise.race([
            imageUrlPromise.catch((err) => {
              console.error('[MESSAGE-THREAD] getImageUrls promise rejected:', err);
              return new Map<string, string>();
            }),
            timeoutPromise,
          ]).then((imageUrlMap) => {
            // threadIdが変更された場合は処理を中断
            if (prevThreadIdRef.current !== currentThreadId) {
              console.log('[MESSAGE-THREAD] ThreadId changed before updating image URLs, aborting');
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
          }).catch((err) => {
            console.error('[MESSAGE-THREAD] Error updating image URLs:', err);
          });
        }
      } catch (err) {
        console.error('[MESSAGE-THREAD] Failed to fetch thread data:', err);
        console.error('[MESSAGE-THREAD] Error details:', {
          message: (err as any)?.message,
          status: (err as any)?.status,
          stack: (err as any)?.stack
        });

        // threadIdが変更された場合はエラーを無視
        if (prevThreadIdRef.current !== currentThreadId) {
          console.log('[MESSAGE-THREAD] Error but threadId changed, ignoring');
          return;
        }

        // 404エラーの場合は特別な処理
        if ((err as any)?.status === 404) {
          // URLパラメータから相手のユーザーIDを取得してthreadを作成
          const urlParams = new URLSearchParams(window.location.search);
          const otherUserId = urlParams.get('user_id');

          if (otherUserId && otherUserId !== user.id) {
            // 相手のユーザーIDが指定されている場合、新しいthreadを作成
            console.log('[MESSAGE-THREAD] Thread not found, creating new thread with user:', otherUserId);
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
              console.error('[MESSAGE-THREAD] Failed to create thread:', createErr);
            }
          }

          // threadを作成できない場合、エラーメッセージを表示
          setError('このスレッドは存在しないか、削除されました');
          setMessages([]);
          setThreadDetail(null);

          // 2秒後にメッセージ一覧にリダイレクト
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
        // エラーが発生した場合でも、確実に読み込み状態を解除
        // threadIdが変更されていない場合のみ状態を更新
        console.log('[MESSAGE-THREAD] Fetch complete, setting isLoadingMessages to false', {
          currentThreadId,
          prevThreadId: prevThreadIdRef.current
        });
        if (prevThreadIdRef.current === currentThreadId) {
          setIsLoadingMessages(false);
        } else {
          console.log('[MESSAGE-THREAD] Skipping isLoadingMessages update, threadId changed');
        }
      }
    };

    fetchThreadData();

    // クリーンアップ: コンポーネントのアンマウント時に実行
    return () => {
      abortController.abort();
    };
  }, [threadId, user]);

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
            console.error('Failed to get signed URL for image:', err);
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
      console.error('Failed to send message:', err);
      setError('メッセージの送信に失敗しました');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [threadId, isSending, user]);

  const handleSendContract = useCallback(async (contractFile: File, contractType: string) => {
    if (!threadId || isSending || !user) return;

    const tempId = `temp-${Date.now()}`;

    // 楽観的UI: メッセージを即座に表示
    const optimisticMessage: MessageWithSender = {
      id: tempId,
      thread_id: threadId,
      sender_id: user.id,
      sender_user_id: user.id,
      type: 'contract',
      content: contractType,
      text: contractType,
      image_url: URL.createObjectURL(contractFile),
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
      let fileUrl: string | null = null;

      try {
        const uploadResponse = await messageApi.uploadContractDocument(contractFile);
        if (uploadResponse.success && uploadResponse.data) {
          fileUrl = uploadResponse.data.file_path;
        }
      } catch (uploadErr) {
        console.error('Failed to upload contract:', uploadErr);
        setError('契約書のアップロードに失敗しました');
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setIsSending(false);
        throw uploadErr;
      }

      const response = await messageApi.sendMessage({
        thread_id: threadId,
        type: 'contract',
        text: contractType,
        file_url: fileUrl ? fileUrl : undefined,
        contract_type: contractType,
      });

      let sentMessage: MessageWithSender | null = null;
      if (response && typeof response === 'object' && 'id' in response) {
        sentMessage = response as MessageWithSender;
      }

      if (sentMessage) {
        // バックエンドから既にsigned URLが返されている場合はそのまま使用
        let signedFileUrl = sentMessage.image_url;
        if (sentMessage.image_url && !sentMessage.image_url.startsWith('http://') && !sentMessage.image_url.startsWith('https://')) {
          // ファイルパスの場合のみsigned URLを取得
          try {
            const imageUrlMap = await getImageUrls([sentMessage.image_url], 'contract-documents');
            signedFileUrl = imageUrlMap.get(sentMessage.image_url) || sentMessage.image_url;
          } catch (err) {
            console.error('Failed to get signed URL for contract:', err);
            // エラーが発生しても元のURLを使用
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId
              ? {
                  ...sentMessage!,
                  image_url: signedFileUrl,
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
      console.error('Failed to send contract:', err);
      setError('契約書の送信に失敗しました');
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [threadId, isSending, user]);

  if (!user) return null;

  console.log('[MESSAGE-THREAD-CONTAINER] Rendering MessageThread:', { isLoadingMessages, messagesLength: messages.length, threadId });

  return (
    <MessageThread
      threadDetail={threadDetail}
      messages={messages}
      currentUserId={user.id}
      onSendMessage={handleSendMessage}
      onSendContract={handleSendContract}
      isSending={isSending}
      isLoadingMessages={isLoadingMessages}
      onBack={onBack}
    />
  );
}

export default memo(MessageThreadContainer);
