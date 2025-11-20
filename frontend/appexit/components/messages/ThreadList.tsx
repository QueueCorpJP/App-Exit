'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ThreadWithLastMessage } from '@/lib/api-client';
import { truncateDisplayName } from '@/lib/text-utils';
import { getImageUrl } from '@/lib/storage';

interface ThreadListProps {
  threads: ThreadWithLastMessage[];
  selectedThreadId?: string;
  currentUserId: string;
  onThreadSelect: (thread: ThreadWithLastMessage) => void;
  error: string | null;
  onErrorDismiss: () => void;
  isLoading?: boolean;
}

interface ThreadItemProps {
  thread: ThreadWithLastMessage;
  isSelected: boolean;
  currentUserId: string;
  onSelect: (thread: ThreadWithLastMessage) => void;
}

const ThreadItem = memo(({ thread, isSelected, currentUserId, onSelect }: ThreadItemProps) => {
  const locale = useLocale();
  const t = useTranslations('messages');
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return t('minutesAgo', { minutes: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('hoursAgo', { hours: diffInHours });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('daysAgo', { days: diffInDays });

    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const handleClick = useCallback(() => {
    onSelect(thread);
  }, [onSelect, thread]);

  // 相手のユーザー情報を取得（自分以外の参加者）
  const otherParticipant = thread.participants?.find(p => p.id !== currentUserId);

  const displayName = otherParticipant?.display_name ? truncateDisplayName(otherParticipant.display_name, 'post') : t('user');
  
  // アイコンのURLを取得
  useEffect(() => {
    const fetchIconUrl = async () => {
      if (otherParticipant?.icon_url) {
        // 既に完全なURLの場合はそのまま使用
        if (otherParticipant.icon_url.startsWith('http://') || otherParticipant.icon_url.startsWith('https://')) {
          setIconUrl(otherParticipant.icon_url);
          return;
        }
        
        try {
          const url = await getImageUrl(otherParticipant.icon_url, 'profile-icons');
          setIconUrl(url);
        } catch (error) {
          setIconUrl(null);
        }
      } else {
        setIconUrl(null);
      }
    };
    
    fetchIconUrl();
  }, [otherParticipant?.icon_url]);

  const lastMessageText = thread.last_message?.text || t('selectConversation');
  const lastMessageTime = thread.last_message?.created_at || thread.created_at;

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50/50' : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={displayName}
            loading="lazy"
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              // 画像読み込みエラー時にデフォルトアイコンを表示
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ display: iconUrl ? 'none' : 'flex' }}
        >
          <span>👤</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm truncate" title={otherParticipant?.display_name || t('user')}>
              {displayName}
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
});

ThreadItem.displayName = 'ThreadItem';

function ThreadList({
  threads,
  selectedThreadId,
  currentUserId,
  onThreadSelect,
  error,
  onErrorDismiss,
  isLoading = false,
}: ThreadListProps) {
  const locale = useLocale();
  const t = useTranslations('messages');

  return (
    <div className="w-full md:w-80 border-r border-gray-200 flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold" style={{ color: '#323232' }}>
            {t('title')}
          </h1>
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
        <div className="p-4 bg-red-50 border-b border-red-200 flex-shrink-0">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={onErrorDismiss}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            {t('close')}
          </button>
        </div>
      )}

      {/* 会話リスト */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-xs text-gray-500">
              {t('loading')}
            </p>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">
              {t('noMessages')}
            </p>
          </div>
        ) : (
          threads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              isSelected={selectedThreadId === thread.id}
              currentUserId={currentUserId}
              onSelect={onThreadSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default memo(ThreadList);
