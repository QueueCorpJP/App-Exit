'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { commentApi, PostCommentWithDetails, CreateCommentRequest } from '@/lib/api-client';
import StorageImage from '@/components/ui/StorageImage';
import { useAuth } from '@/lib/auth-context';
import { sanitizeText, INPUT_LIMITS } from '@/lib/input-validator';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [comments, setComments] = useState<PostCommentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await commentApi.getPostComments(postId);
      // dataが配列であることを確認
      if (Array.isArray(data)) {
        setComments(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
        // バックエンドが { data: [...] } という形式で返している場合
        setComments((data as any).data);
      } else {
        setComments([]);
      }
    } catch (error) {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = useCallback(async () => {
    if (!commentContent.trim() || !user) {
      return;
    }

    // 🔒 SECURITY: コメント内容をサニタイズ
    const sanitized = sanitizeText(commentContent, INPUT_LIMITS.TEXTAREA, {
      allowHTML: false,
      strictMode: false,
    });

    if (!sanitized.isValid) {
      alert(t('invalidContent') || 'Invalid content detected. Please remove any potentially harmful code.');
      return;
    }

    try {
      setSubmitting(true);
      const newComment = await commentApi.createComment(postId, {
        content: sanitized.sanitized,
      });
      setComments([...comments, newComment]);
      setCommentContent('');
    } catch (error) {
      alert(t('failedToPost'));
    } finally {
      setSubmitting(false);
    }
  }, [commentContent, user, postId, comments, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleToggleLike = useCallback(async (commentId: string) => {
    if (!user) {
      alert(t('loginRequired'));
      return;
    }

    try {
      const result = await commentApi.toggleCommentLike(commentId);
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                like_count: result.like_count,
                is_liked: result.is_liked,
              }
            : comment
        )
      );
    } catch (error) {
    }
  }, [user, comments, t]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('justNow');
    } else if (diffInSeconds < 3600) {
      return t('minutesAgo', { minutes: Math.floor(diffInSeconds / 60) });
    } else if (diffInSeconds < 86400) {
      return t('hoursAgo', { hours: Math.floor(diffInSeconds / 3600) });
    } else if (diffInSeconds < 2592000) {
      return t('daysAgo', { days: Math.floor(diffInSeconds / 86400) });
    } else {
      return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US');
    }
  };

  return (
    <div className="space-y-6">
      {/* コメント入力エリア */}
      {user && (
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            {profile?.icon_url ? (
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <StorageImage
                  path={profile.icon_url}
                  alt={profile.display_name || (t('user'))}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-gray-600">
                  {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 flex items-center gap-2">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('addComment')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                rows={1}
                maxLength={INPUT_LIMITS.TEXTAREA}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || submitting}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-70"
                aria-label={t('postComment')}
              >
                {submitting ? (
                  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* コメント一覧 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">
          {t('loading')}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('noComments')}
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.author_profile?.icon_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <StorageImage
                    path={comment.author_profile.icon_url}
                    alt={comment.author_profile.display_name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {comment.author_profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900">
                    {comment.author_profile?.display_name || (t('anonymousUser'))}
                  </span>
                  <span className="text-xs text-gray-500">• {formatTimeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <button
                    onClick={() => handleToggleLike(comment.id)}
                    className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                      comment.is_liked ? 'text-red-500' : ''
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={comment.is_liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{comment.like_count}</span>
                  </button>
                  {comment.reply_count > 0 && (
                    <span className="text-xs text-gray-500">
                      {t('replies', { count: comment.reply_count })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

