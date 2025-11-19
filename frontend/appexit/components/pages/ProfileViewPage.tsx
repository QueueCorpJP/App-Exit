'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { profileApi, Profile } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { postApi, Post } from '@/lib/api-client';
import { truncateDisplayName } from '@/lib/text-utils';

interface ProfileViewPageProps {
  userId: string;
}

export default function ProfileViewPage({ userId }: ProfileViewPageProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'board' | 'transaction' | 'secret'>('all');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // プロフィールと投稿を並列で取得
        const [profile, postsResult] = await Promise.allSettled([
          profileApi.getProfileById(userId),
          postApi.getPosts({
            author_user_id: userId,
            limit: 50
          })
        ]);

        // プロフィール結果の処理
        if (profile.status === 'fulfilled' && profile.value) {
          console.log('[ProfileViewPage] Loaded profile:', profile.value);
          setProfile(profile.value);
        } else {
          console.error('プロフィールデータの取得に失敗しました:', profile.status === 'rejected' ? profile.reason : 'No data');
        }

        // 投稿結果の処理
        if (postsResult.status === 'fulfilled') {
          setPosts(Array.isArray(postsResult.value) ? postsResult.value : []);
        } else {
          console.error('投稿の取得に失敗しました:', postsResult.reason);
          setPosts([]);
        }
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getJoinDate = () => {
    if (!profile?.created_at) return '';
    const date = new Date(profile.created_at);
    return `${date.getFullYear()}年${date.getMonth() + 1}月からプロダクトExitを利用しています`;
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'board':
        return '掲示板';
      case 'transaction':
        return '取引';
      case 'secret':
        return '秘密';
      default:
        return type;
    }
  };

  const getPostTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'board':
        return 'bg-blue-100 text-blue-700';
      case 'transaction':
        return 'bg-green-100 text-green-700';
      case 'secret':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse px-4 pt-4">
            <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">プロフィールが見つかりません</p>
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* ヘッダー */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors mr-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900" title={profile.display_name}>{truncateDisplayName(profile.display_name, 'header')}</h1>
              <p className="text-sm text-gray-500">{posts.length} 件の投稿</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* プロフィール画像と編集ボタン */}
        <div className="flex items-end justify-between mb-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            {profile.icon_url ? (
              <Image
                src={profile.icon_url}
                alt={profile.display_name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {isOwnProfile ? (
            <div className="flex items-center space-x-2 mb-4">
              <Link
                href="/settings/profile"
                className="px-4 py-2 border border-gray-300 rounded-full font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                プロフィールを編集
              </Link>
            </div>
          ) : (
            <button className="px-4 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors mb-4">
              フォロー
            </button>
          )}
        </div>

        {/* プロフィール詳細 */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900" title={profile.display_name}>{truncateDisplayName(profile.display_name, 'profile')}</h2>
            {profile.role === 'seller' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">@{profile.id.substring(0, 8)}</p>

          {/* ユーザータイプと属性 */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                {profile.role === 'seller' ? '売り手' : '買い手'}
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                {profile.party === 'organization' ? '法人' : '個人'}
              </span>
              {profile.nda_flag && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                  NDA締結済み
                </span>
              )}
            </div>
            {profile.age && (
              <div className="text-sm text-gray-600">
                年齢: {profile.age}歳
              </div>
            )}
          </div>

          {/* 参加日 */}
          {profile.created_at && (
            <div className="mb-3">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{getJoinDate()}</span>
              </div>
            </div>
          )}
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'all' as const, label: 'すべて', count: posts.length },
            { id: 'board' as const, label: '掲示板', count: posts.filter((p: Post) => p.type === 'board').length },
            { id: 'transaction' as const, label: '取引', count: posts.filter((p: Post) => p.type === 'transaction').length },
            { id: 'secret' as const, label: '秘密', count: posts.filter((p: Post) => p.type === 'secret').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-2 text-xs text-gray-500">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="py-4">
          <div className="space-y-0">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {activeTab === 'all' 
                    ? '投稿がありません' 
                    : `${getPostTypeLabel(activeTab)}の投稿がありません`}
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/projects/${post.id}`}
                  className="block border-b border-gray-200 py-4 px-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profile.icon_url ? (
                        <Image
                          src={profile.icon_url}
                          alt={profile.display_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">{profile.display_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        {/* デスクトップ: 横並び */}
                        <div className="hidden sm:flex items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900" title={profile.display_name}>{truncateDisplayName(profile.display_name, 'post')}</span>
                            <span className="text-gray-500 text-sm">@{profile.id.substring(0, 8)}</span>
                            <span className="text-gray-500 text-sm">·</span>
                            <span className="text-gray-500 text-sm">{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* モバイル: 縦並び */}
                        <div className="sm:hidden">
                          <div className="flex items-center mb-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900" title={profile.display_name}>{truncateDisplayName(profile.display_name, 'post')}</span>
                              <span className="text-gray-500 text-sm">@{profile.id.substring(0, 8)}</span>
                            </div>
                          </div>
                          <div className="text-gray-500 text-sm">
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      {post.body && (
                        <p className="text-gray-700 mb-2 line-clamp-2">{post.body}</p>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        {(post.price || (post.budget_min && post.budget_max)) && (
                          <div>
                            {post.price ? (
                              <span className="text-lg font-bold text-green-600">
                                ¥{post.price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-600">
                                予算: ¥{post.budget_min?.toLocaleString()} - ¥{post.budget_max?.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getPostTypeBadgeColor(post.type)}`}>
                            {getPostTypeLabel(post.type)}
                          </span>
                        </div>
                      </div>
                      {post.cover_image_url && post.cover_image_url.trim() !== '' && (post.cover_image_url.startsWith('http://') || post.cover_image_url.startsWith('https://')) && (
                        <div className="rounded-lg overflow-hidden mb-2 mt-2">
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            width={500}
                            height={300}
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                      {post.secret_visibility === 'price_only' && (
                        <div className="mt-2 text-xs text-purple-600">
                          🔒 価格情報のみ公開
                        </div>
                      )}
                      {post.secret_visibility === 'hidden' && (
                        <div className="mt-2 text-xs text-purple-600">
                          🔒 非公開投稿
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}