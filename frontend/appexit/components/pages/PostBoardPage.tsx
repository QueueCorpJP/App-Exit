'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, ArrowUp, ArrowDown, MessageCircle, Share2, MoreHorizontal, Award, Flame, Image as ImageIcon, X, ChevronDown, Calendar, Globe, Send } from 'lucide-react';
import { postApi } from '@/lib/api-client';
import { uploadImage, getImageUrls } from '@/lib/storage';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  body: string | null;
  cover_image_url: string | null;
  author_user_id: string;
  created_at: string;
  type: string;
}

interface PostWithImageUrl extends Post {
  imageUrl?: string;
}

interface PostBoardPageProps {
  initialPosts: Post[];
}

export default function PostBoardPage({ initialPosts = [] }: PostBoardPageProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithImageUrl[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [replyToUser, setReplyToUser] = useState<string | null>(null);

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
      const imagePaths = postsData.map(post => post.cover_image_url).filter((path): path is string => !!path);
      console.log('[BOARD] Image paths:', imagePaths);

      // 署名付きURLを一括取得
      const imageUrlMap = await getImageUrls(imagePaths);
      console.log('[BOARD] Image URL map size:', imageUrlMap.size);

      // 投稿データに画像URLを追加
      const postsWithImages: PostWithImageUrl[] = postsData.map(post => {
        const imageUrl = post.cover_image_url ? imageUrlMap.get(post.cover_image_url) : undefined;
        console.log(`[BOARD] Post ${post.id}: path="${post.cover_image_url}" → url="${imageUrl ? imageUrl.substring(0, 50) + '...' : 'none'}"`);

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
        body: formData.body,
        cover_image_url: coverImagePath,
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

  const CommentItem = ({ username = 'ユーザー', timeAgo = '1日前', body = 'コメント内容', votes = 0, replyTo }: {
    username?: string;
    timeAgo?: string;
    body?: string;
    votes?: number;
    replyTo?: string;
  }) => {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{username}</span>
            <span className="text-xs text-gray-500">• {timeAgo}</span>
          </div>
          {replyTo && (
            <div className="text-xs text-blue-600 mb-1">
              <MessageCircle className="w-3 h-3 inline mr-1" />
              @{replyTo} への返信
            </div>
          )}
          <p className="text-sm text-gray-800 mb-2">{body}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <button className="flex items-center gap-1 hover:text-orange-500">
              <ArrowUp className="w-4 h-4" />
              <span>{votes}</span>
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              className="flex items-center gap-1 hover:text-blue-600"
              onClick={() => setReplyToUser(username)}
            >
              <MessageCircle className="w-4 h-4" />
              返信
            </button>
            <button className="flex items-center gap-1 hover:text-blue-600">
              <Award className="w-4 h-4" />
              アワードを贈る
            </button>
            <button className="hover:text-blue-600">
              <Share2 className="w-4 h-4 inline" /> 共有
            </button>
            <button><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  };

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
          <h2 className="text-lg font-bold text-gray-900 mb-4">新しいトピックを作成</h2>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {post.author_user_id[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">@{post.author_user_id.substring(0, 8)}</span>
                  <span className="text-sm text-gray-500">• {new Date(post.created_at).toLocaleDateString('ja-JP')}</span>
                  <button className="ml-auto">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
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
                    <button className="hover:text-orange-500 transition-colors">
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold">0</span>
                    <button className="hover:text-blue-500 transition-colors">
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>

                  <button className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-bold">0</span>
                  </button>

                  <button className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-bold">共有</span>
                  </button>
                </div>
              </div>

              {/* Comment Input Section */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {replyToUser && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                      <span>@{replyToUser} に返信中</span>
                      <button onClick={() => setReplyToUser(null)} className="hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={replyToUser ? `@${replyToUser} に返信...` : "コメントを追加..."}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-6 space-y-6">
                <CommentItem
                  username="Dr-Dark-Flames"
                  timeAgo="28日前"
                  body="Self host Q yall"
                  votes={99}
                />
                <CommentItem
                  username="Railway-User"
                  timeAgo="27日前"
                  body="Or, Railway with one click deploy with Next.js and Postgres Database"
                  votes={10}
                  replyTo="Dr-Dark-Flames"
                />
                <CommentItem
                  username="JamieClimbsRocks"
                  timeAgo="28日前"
                  body="Have never used Vercel as there is this alternative: https://opennext.js.org/ ✅"
                  votes={68}
                />
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
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>2016年10月25日に作成されました</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Globe className="w-4 h-4" />
                  <span>公開</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <div className="text-2xl font-bold">14万</div>
                    <div className="text-xs text-gray-600">人の週間訪問者</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">1285</div>
                    <div className="text-xs text-gray-600">再送の投稿</div>
                  </div>
                </div>

                {/* Community Bookmarks */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">コミュニティのブックマーク</h3>
                  <button className="w-full mb-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    Website
                  </button>
                  <button className="w-full px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    Github
                  </button>
                </div>
              </div>

              {/* Rules Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-sm font-semibold mb-3">R/NEXTJSのルール</h3>
                <div className="space-y-2">
                  <RuleItem number={1} text="Stay polite" />
                  <RuleItem number={2} text="No product/project/portfolio shilling" expandable />
                  <RuleItem number={3} text="No low effort posts" expandable />
                  <RuleItem number={4} text="This is not a job board" />
                  <RuleItem number={5} text="No rate my website or ask for feedback posts" expandable />
                </div>
              </div>

              {/* Related Subreddits Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-sm font-semibold mb-3">RELATED SUBREDDITS</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      r/
                    </div>
                    <div>
                      <div className="text-sm font-medium">r/reactjs</div>
                      <div className="text-xs text-gray-500">476,922 members</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-bold">
                      JS
                    </div>
                    <div>
                      <div className="text-sm font-medium">r/javascript</div>
                      <div className="text-xs text-gray-500">2,409,943 members</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Resources Card */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <h3 className="text-sm font-semibold mb-2">SIDEBAR</h3>
                <p className="text-sm mb-2">New to Next.js?</p>
                <p className="text-sm mb-3">Here are great, <span className="font-semibold">free</span> resources!</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">• The official Next.js docs</a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">• The official Next.js learn course</a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">• The React docs</a>
                  </li>
                </ul>
              </div>
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
