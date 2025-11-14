'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, ArrowUp, ArrowDown, MessageCircle, Share2, MoreHorizontal, Award, Flame, Image as ImageIcon, X, ChevronDown, Calendar, Globe, Send, Twitter, Facebook, Linkedin } from 'lucide-react';
import { postApi, commentApi, PostCommentWithDetails } from '@/lib/api-client';
import { uploadImage, getImageUrls } from '@/lib/storage';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  body: string | null;
  eyecatch_url: string | null;
  author_user_id: string;
  created_at: string;
  type: string;
}

interface PostWithImageUrl extends Post {
  imageUrl?: string;
}

interface SidebarStats {
  total_posts: number;
  unique_authors: number;
  first_post_date: string;
  total_comments: number;
}

interface PopularPost {
  id: string;
  title: string;
  like_count: number;
}

interface RecentPost {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarData {
  stats: SidebarStats;
  popular_posts: PopularPost[];
  recent_posts: RecentPost[];
}

interface PostBoardPageProps {
  initialPosts: Post[];
  sidebarData?: SidebarData;
}

export default function PostBoardPage({ initialPosts = [], sidebarData }: PostBoardPageProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithImageUrl[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyToUser, setReplyToUser] = useState<string | null>(null);
  const [likeStates, setLikeStates] = useState<Record<string, { like_count: number; is_liked: boolean }>>({});
  const [dislikeStates, setDislikeStates] = useState<Record<string, { dislike_count: number; is_disliked: boolean }>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [commentSectionsOpen, setCommentSectionsOpen] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, PostCommentWithDetails[]>>({});
  const [shareMenuOpen, setShareMenuOpen] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });

  // initialPostsが変更されたら画像URLを取得
  useEffect(() => {
    if (initialPosts.length > 0) {
      loadImageUrls(initialPosts);
    } else {
      setPosts([]);
    }
  }, [initialPosts]);

  // 投稿データから画像URLを取得して設定
  const loadImageUrls = async (postsData: Post[]) => {
    try {
      if (postsData.length === 0) {
        setPosts([]);
        return;
      }

      // 画像パスを収集
      const imagePaths = postsData.map(post => post.eyecatch_url).filter((path): path is string => !!path);
      console.log('[BOARD] Image paths:', imagePaths);

      // 署名付きURLを一括取得
      const imageUrlMap = await getImageUrls(imagePaths);
      console.log('[BOARD] Image URL map size:', imageUrlMap.size);

      // 投稿データに画像URLを追加
      const postsWithImages: PostWithImageUrl[] = postsData.map(post => {
        const imageUrl = post.eyecatch_url ? imageUrlMap.get(post.eyecatch_url) : undefined;
        console.log(`[BOARD] Post ${post.id}: path="${post.eyecatch_url}" → url="${imageUrl ? imageUrl.substring(0, 50) + '...' : 'none'}"`);

        return {
          ...post,
          imageUrl,
        };
      });

      console.log('[BOARD] Posts with images:', postsWithImages.length);
      setPosts(postsWithImages);
    } catch (err) {
      console.error('[BOARD] Failed to load image URLs:', err);
    }
  };

  // 投稿のメタ情報（いいね/バット、コメント数）とコメントを一括取得
  useEffect(() => {
    const fetchMetaAndComments = async () => {
      if (initialPosts.length === 0) return;
      try {
        const postIds = initialPosts.map(p => p.id);

        // 1回のAPIリクエストで全メタデータを取得
        const metadata = await postApi.getBatchMetadata(postIds);

        const updatesLike: Record<string, { like_count: number; is_liked: boolean }> = {};
        const updatesDislike: Record<string, { dislike_count: number; is_disliked: boolean }> = {};
        const updatesCommentCount: Record<string, number> = {};

        // メタデータをステートに変換
        metadata.forEach(meta => {
          updatesLike[meta.post_id] = {
            like_count: meta.like_count,
            is_liked: meta.is_liked
          };
          updatesDislike[meta.post_id] = {
            dislike_count: meta.dislike_count,
            is_disliked: meta.is_disliked
          };
          updatesCommentCount[meta.post_id] = meta.comment_count;
        });

        setLikeStates(updatesLike);
        setDislikeStates(updatesDislike);
        setCommentCounts(updatesCommentCount);

        // 全投稿のコメントを一括取得
        const commentsPromises = postIds.map(async (postId) => {
          try {
            const comments = await commentApi.getPostComments(postId);
            if (Array.isArray(comments)) {
              // 古い順にソート（created_atの昇順）
              const sortedComments = comments.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              return { postId, comments: sortedComments };
            }
            return { postId, comments: [] };
          } catch (e) {
            console.error(`[BOARD] Failed to load comments for post ${postId}:`, e);
            return { postId, comments: [] };
          }
        });

        const commentsResults = await Promise.all(commentsPromises);
        const commentsMap: Record<string, PostCommentWithDetails[]> = {};
        commentsResults.forEach(({ postId, comments }) => {
          commentsMap[postId] = comments;
        });
        setPostComments(commentsMap);
      } catch (e) {
        console.warn('[BOARD] Failed to load meta:', e);
      }
    };
    fetchMetaAndComments();
    // initialPostsが変わったら再取得
  }, [initialPosts]);

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

    if (!user) {
      setError('ログインが必要です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let coverImagePath: string | null = null;
      if (selectedImageFile) {
        coverImagePath = await uploadImage(selectedImageFile, user.id);
      }

      const payload = {
        type: 'board' as const,
        title: formData.title,
        body: formData.body.trim() || undefined,
        eyecatch_url: coverImagePath || undefined,
        is_active: true,
      };

      // apiClientを使用してトークンリフレッシュを自動処理
      await postApi.createPost(payload);

      setFormData({ title: '', body: '' });
      setSelectedImageFile(null);
      setImagePreview(null);

      // サーバーコンポーネントを再実行して最新データを取得
      router.refresh();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 投稿のいいね/バット切替
  const handleToggleLike = async (postId: string) => {
    try {
      const res = await postApi.toggleLike(postId);
      setLikeStates(prev => ({ ...prev, [postId]: { like_count: res.like_count ?? 0, is_liked: res.is_liked ?? false } }));
    } catch (e) {
      console.error('toggle like failed', e);
    }
  };
  const handleToggleDislike = async (postId: string) => {
    try {
      const res = await postApi.toggleDislike(postId);
      setDislikeStates(prev => ({ ...prev, [postId]: { dislike_count: res.dislike_count ?? 0, is_disliked: res.is_disliked ?? false } }));
    } catch (e) {
      console.error('toggle dislike failed', e);
    }
  };

  // コメントセクションの開閉（コメントは既に取得済みなので開閉のみ）
  const toggleCommentSection = (postId: string) => {
    setCommentSectionsOpen(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // コメント送信（Enterで送信）
  const handleSubmitComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    try {
      await commentApi.createComment(postId, { content: text });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // コメント一覧を再取得して最新のコメントを表示
      const comments = await commentApi.getPostComments(postId);
      if (Array.isArray(comments)) {
        // 古い順にソート（created_atの昇順）
        const sortedComments = comments.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setPostComments(prev => ({ ...prev, [postId]: sortedComments }));
        setCommentCounts(prev => ({ ...prev, [postId]: sortedComments.length }));
      }
    } catch (e) {
      console.error('create comment failed', e);
    }
  };

  // 共有メニューの開閉
  const toggleShareMenu = (postId: string) => {
    setShareMenuOpen(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // SNS共有関数
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin', post: PostWithImageUrl) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const postUrl = `${baseUrl}/projects/new/board?post=${post.id}`;
    const text = post.title;
    const description = post.body || '';

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
    }

    // 新しいウィンドウで共有URLを開く
    window.open(shareUrl, '_blank', 'width=600,height=400');

    // 共有メニューを閉じる
    setShareMenuOpen(prev => ({ ...prev, [post.id]: false }));
  };

  const CommentItem = ({ comment }: { comment: PostCommentWithDetails }) => {
    const displayName = comment.author_profile?.display_name || `User ${comment.user_id.substring(0, 8)}`;
    const timeAgo = formatTimeAgo(new Date(comment.created_at));

    return (
      <div className="flex gap-3 py-3">
        <button
          onClick={() => router.push(`/profile/${comment.user_id}`)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
        >
          {displayName[0].toUpperCase()}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push(`/profile/${comment.user_id}`)}
              className="font-semibold text-sm text-gray-900 hover:underline"
            >
              {displayName}
            </button>
            <span className="text-xs text-gray-500">• {timeAgo}</span>
          </div>
          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <button className="hover:text-orange-500 transition-colors">
                <ArrowUp className="w-4 h-4" />
              </button>
              <span className="font-medium">{comment.like_count || 0}</span>
              <button className="hover:text-blue-500 transition-colors">
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
            <button
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              onClick={() => setReplyToUser(displayName)}
            >
              <MessageCircle className="w-4 h-4" />
              <span>返信</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 時間経過を表示する関数
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
  };

  // 外側のクリックで共有メニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // クリックされた要素が共有ボタンまたはメニュー内でない場合、すべてのメニューを閉じる
      if (!target.closest('.share-menu-container')) {
        setShareMenuOpen({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* Community Header - Reddit style */}
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Banner Background - Rounded */}
            <div
              className="h-24 rounded-2xl bg-red-500"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1200&h=200&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            {/* Community Icon with background circle - Overlapping banner */}
            <div className="absolute bottom-0 left-8 transform translate-y-1/2">
              <div className="relative">
                {/* Background circle - same color as page background */}
                <div
                  className="absolute inset-0 w-22 h-22 rounded-full -left-1 -top-1"
                  style={{ backgroundColor: '#F9F8F7', zIndex: 1 }}
                />

                {/* Community Icon */}
                <div
                  className="relative w-20 h-20 rounded-full bg-black flex items-center justify-center text-white font-bold text-2xl"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=80&h=80&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 2
                  }}
                />
              </div>
            </div>
          </div>

          {/* Community Name - Below banner, next to icon */}
          <div className="flex items-center gap-4 mt-3 ml-8">
            <div className="w-20" />
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl" style={{ color: '#4a4a4a', fontWeight: '800' }}>掲示板投稿</h1>
              <p className="text-sm" style={{ color: '#6b7280', fontWeight: '700' }}>気軽にやり取りしよう</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-4" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Main Layout - Grid with sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main Content */}
          <div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Post Creation Form - At the top */}
        <div className="mb-6 bg-white rounded-lg p-6" style={{ border: '1px solid #E9EEF2' }}>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => user?.id && router.push(`/profile/${user.id}`)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-opacity"
              >
                {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </button>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="タイトルを入力..."
              />
            </div>

            <div className="relative mb-3">
              <textarea
                required
                rows={3}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full px-4 py-2 pb-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="詳細を記載してください..."
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute bottom-2 right-2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={loading ? '投稿中...' : '投稿する'}
              >
                <Send className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3">
                <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center">
              <label className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm">画像を追加</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          </form>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center">
              <p className="text-gray-500 mb-2">まだ投稿がありません</p>
              <p className="text-sm text-gray-400">最初の投稿を作成してみましょう！</p>
            </div>
          )}

          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg" style={{ border: '1px solid #E9EEF2' }}>
              {/* Post Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => router.push(`/profile/${post.author_user_id}`)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {post.author_user_id[0].toUpperCase()}
                  </button>
                  <button
                    onClick={() => router.push(`/profile/${post.author_user_id}`)}
                    className="text-sm font-medium hover:underline"
                  >
                    @{post.author_user_id.substring(0, 8)}
                  </button>
                  <span className="text-sm text-gray-500">• {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                  {/* 自分の投稿にのみ三点マークを表示 */}
                  {user?.id === post.author_user_id && (
                    <button className="ml-auto">
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>

                {/* Body */}
                {post.body && (
                  <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">{post.body}</p>
                )}

                {/* Image */}
                {post.imageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="max-h-96 w-auto"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                  <button
                    className={`hover:text-orange-500 transition-colors ${likeStates[post.id]?.is_liked ? 'text-orange-500' : ''}`}
                    onClick={() => handleToggleLike(post.id)}
                  >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  <span className="text-sm font-bold">{likeStates[post.id]?.like_count ?? 0}</span>
                  <button
                    className={`hover:text-blue-500 transition-colors ${dislikeStates[post.id]?.is_disliked ? 'text-blue-500' : ''}`}
                    onClick={() => handleToggleDislike(post.id)}
                  >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                <button
                  className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
                  onClick={() => toggleCommentSection(post.id)}
                >
                    <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">{commentCounts[post.id] ?? 0}</span>
                  </button>

                  <div className="relative share-menu-container">
                    <button
                      className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors"
                      onClick={() => toggleShareMenu(post.id)}
                    >
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-bold">共有</span>
                    </button>

                    {/* 共有メニュードロップダウン */}
                    {shareMenuOpen[post.id] && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[200px]">
                        <button
                          onClick={() => handleShare('twitter', post)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
                        >
                          <Twitter className="w-5 h-5 text-blue-400" />
                          <span className="text-sm font-medium">Twitter で共有</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook', post)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
                        >
                          <Facebook className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">Facebook で共有</span>
                        </button>
                        <button
                          onClick={() => handleShare('linkedin', post)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
                        >
                          <Linkedin className="w-5 h-5 text-blue-700" />
                          <span className="text-sm font-medium">LinkedIn で共有</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Input Section & Comments - Only show when open */}
              <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{
                  maxHeight: commentSectionsOpen[post.id] ? '2000px' : '0',
                  opacity: commentSectionsOpen[post.id] ? 1 : 0,
                }}
              >
                {/* Comment Input Section */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col gap-2">
                    {replyToUser && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <span>@{replyToUser} に返信中</span>
                        <button onClick={() => setReplyToUser(null)} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] ?? ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment(post.id);
                          }
                        }}
                        placeholder={replyToUser ? `@${replyToUser} に返信...` : "コメントを追加..."}
                        className="flex-1 px-4 py-2.5 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="absolute right-2 p-2 text-blue-500 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                        title="送信"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="p-6">
                  <div className="space-y-2 divide-y divide-gray-100">
                    {postComments[post.id] && postComments[post.id].length > 0 ? (
                      postComments[post.id].map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>まだコメントがありません</p>
                        <p className="text-xs mt-1">最初のコメントを投稿しましょう！</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              {/* Community Info Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                {sidebarData?.stats.first_post_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(sidebarData.stats.first_post_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}に作成されました</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Globe className="w-4 h-4" />
                  <span>公開</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="text-2xl font-bold">{sidebarData?.stats.total_posts || 0}</div>
                    <div className="text-xs text-gray-600">総投稿数</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{sidebarData?.stats.total_comments || 0}</div>
                    <div className="text-xs text-gray-600">総コメント数</div>
                  </div>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="text-lg font-bold">{sidebarData?.stats.unique_authors || 0}</div>
                  <div className="text-xs text-gray-600">ユニークな投稿者</div>
                </div>
              </div>

              {/* Popular Posts Card */}
              {sidebarData && sidebarData.popular_posts && sidebarData.popular_posts.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold mb-3">人気の投稿</h3>
                  <div className="space-y-3">
                    {sidebarData.popular_posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => router.push(`/projects/new/board?post=${post.id}`)}
                        className="w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Flame className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{post.like_count}いいね</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Posts Card */}
              {sidebarData && sidebarData.recent_posts && sidebarData.recent_posts.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold mb-3">最近の投稿</h3>
                  <div className="space-y-3">
                    {sidebarData.recent_posts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => router.push(`/projects/new/board?post=${post.id}`)}
                        className="w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-2">{post.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTimeAgo(new Date(post.created_at))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rule Item Component
function RuleItem({ number, text, expandable = false }: { number: number; text: string; expandable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{number}</span>
        <span className="text-sm">{text}</span>
      </div>
      {expandable && (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}
