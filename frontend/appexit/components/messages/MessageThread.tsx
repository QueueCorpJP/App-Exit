'use client';

import { useState, memo } from 'react';
import { MessageWithSender, ThreadDetail } from '@/lib/api-client';
import { Image as ImageIcon, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { truncateDisplayName } from '@/lib/text-utils';

interface MessageThreadProps {
  threadDetail: ThreadDetail | null;
  messages: MessageWithSender[];
  currentUserId: string;
  onSendMessage: (text: string, imageFile?: File | null) => Promise<void>;
  isSending: boolean;
  isLoadingMessages: boolean;
  onBack?: () => void;
}

function MessageThread({
  threadDetail,
  messages,
  currentUserId,
  onSendMessage,
  isSending,
  isLoadingMessages,
  onBack,
}: MessageThreadProps) {
  console.log('[MESSAGE-THREAD-COMPONENT] Render:', { isLoadingMessages, messagesLength: messages.length });
  const [newMessage, setNewMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}日前`;

    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = () => {
    if (!threadDetail || !threadDetail.participants) return null;
    return threadDetail.participants.find(p => p.id !== currentUserId);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImageFile) || isSending || isLoadingMessages) return;

    const messageText = newMessage.trim();
    const imageFile = selectedImageFile;
    setNewMessage('');
    setSelectedImageFile(null);
    setImagePreview(null);

    try {
      await onSendMessage(messageText, imageFile);
    } catch (err) {
      // エラー時はメッセージを復元
      setNewMessage(messageText);
      if (imageFile) {
        setSelectedImageFile(imageFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(imageFile);
      }
    }
  };

  const otherParticipant = threadDetail ? getOtherParticipant() : null;

  return (
    <div className="flex-1 md:flex-1 w-full md:w-auto flex flex-col h-full overflow-hidden bg-white">
      {/* チャットヘッダー */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="grid grid-cols-3 items-center gap-4">
          {/* 左側：ユーザー情報 */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                aria-label="戻る"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {otherParticipant?.icon_url ? (
                  <img
                    src={otherParticipant.icon_url}
                    alt={otherParticipant.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>👤</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="font-semibold" title={otherParticipant?.display_name || 'ユーザー'}>
                {otherParticipant?.display_name ? truncateDisplayName(otherParticipant.display_name, 'header') : 'ユーザー'}
              </h2>
            </div>
          </div>

          {/* 中央：契約書状況 */}
          <div className="flex items-center justify-center gap-1">
            <span className="font-semibold" style={{ color: '#323232' }}>
              契約書状況
            </span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: '#323232' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* 右側：売却するボタン */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-sm bg-transparent border-2 hover:opacity-80 gap-2"
              style={{ borderColor: '#E65D65', color: '#E65D65' }}
            >
              売却する
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 bg-white">
        {isLoadingMessages ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>メッセージがありません</p>
            <p className="text-sm mt-2">最初のメッセージを送信しましょう</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_user_id === currentUserId;
            const isSendingMessage = (message as any).is_sending;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? isSendingMessage
                        ? 'bg-blue-400 text-white opacity-70'
                        : 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isOwnMessage && message.sender && (
                    <p className="text-xs mb-1 opacity-70" title={message.sender.display_name}>{truncateDisplayName(message.sender.display_name, 'post')}</p>
                  )}
                  {message.type === 'image' && message.image_url && (
                    <div className="mb-2">
                      <img
                        src={message.image_url}
                        alt="送信画像"
                        className="max-w-full max-h-64 rounded-lg object-contain"
                        onError={(e) => {
                          console.error('Failed to load image:', message.image_url);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {message.text && (
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <p className={`text-xs ${isOwnMessage ? 'opacity-70' : 'text-gray-500'}`}>
                      {formatTime(message.created_at)}
                    </p>
                    {isSendingMessage && (
                      <span className="text-xs opacity-70">• 送信中...</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* メッセージ入力エリア */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 画像プレビュー */}
          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-300" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="新しいメッセージを作成"
                disabled={isSending || isLoadingMessages}
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <label className={`p-1 hover:bg-gray-100 rounded-full ${isLoadingMessages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={isSending || isLoadingMessages}
                  />
                </label>
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedImageFile) || isSending || isLoadingMessages}
                  className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(MessageThread);
