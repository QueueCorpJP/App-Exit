'use client';

import { memo } from 'react';
import { ThreadWithLastMessage } from '@/lib/api-client';

interface ThreadListProps {
  threads: ThreadWithLastMessage[];
  selectedThreadId?: string;
  currentUserId: string;
  onThreadSelect: (thread: ThreadWithLastMessage) => void;
  error: string | null;
  onErrorDismiss: () => void;
  isLoading?: boolean;
}

function ThreadList({
  threads,
  selectedThreadId,
  currentUserId,
  onThreadSelect,
  error,
  onErrorDismiss,
  isLoading = false,
}: ThreadListProps) {
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

  return (
    <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">メッセージ</h1>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={onErrorDismiss}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            閉じる
          </button>
        </div>
      )}

      {/* 会話リスト */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-xs text-gray-500">読み込み中...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">メッセージはありません</p>
          </div>
        ) : (
          threads.map((thread) => {
            const otherParticipantId = thread.participant_ids.find(id => id !== currentUserId);
            const lastMessageText = thread.last_message?.text || 'メッセージを開始';
            const lastMessageTime = thread.last_message?.created_at || thread.created_at;

            return (
              <button
                key={thread.id}
                onClick={() => onThreadSelect(thread)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors ${
                  selectedThreadId === thread.id ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                    <span>👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm truncate">
                        ユーザー
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{lastMessageText}</p>
                    <div className="text-xs text-gray-500 mt-1">{formatTime(lastMessageTime)}</div>
                    {thread.unread_count > 0 && (
                      <span className="inline-block mt-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(ThreadList);
