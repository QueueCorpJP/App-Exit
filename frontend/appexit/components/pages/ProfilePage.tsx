'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { CreditCard, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { profileApi, Profile } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { postApi, Post } from '@/lib/api-client';
import { truncateDisplayName } from '@/lib/text-utils';
import { usePageDict } from '@/lib/page-dict';
import ProjectCard from '@/components/ui/ProjectCard';
import Button from '@/components/ui/Button';
import { getImageUrls } from '@/lib/storage';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface ProfilePageProps {
  pageDict?: Record<string, any>;
}

export default function ProfilePage({ pageDict = {} }: ProfilePageProps) {
  const t = useTranslations();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { loading: authGuardLoading } = useAuthGuard();
  const router = useRouter();
  const locale = useLocale();
  const tp = usePageDict(pageDict);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [watchingPosts, setWatchingPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'board' | 'transaction' | 'secret' | 'watching'>('all');
  const [loading, setLoading] = useState(true);
  const [isLoadingWatching, setIsLoadingWatching] = useState(false);
  const [hasMoreWatching, setHasMoreWatching] = useState(true);
  const [watchingOffset, setWatchingOffset] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsOffset, setPostsOffset] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const INITIAL_POSTS = 3; // 初期表示の投稿数
  const POSTS_PER_PAGE = 6; // 「もっと見る」で追加する投稿数

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      // 認証のローディングが完了するまで待つ
      if (authLoading) return;

      // 認証が完了してもユーザーが存在しない場合はローディングを終了
      if (!currentUser?.id) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
        }

        // ⚡ パフォーマンス改善: プロフィールと投稿を並列取得
        // 初期表示は少数の投稿のみ取得してパフォーマンス向上
        const [profileResult, postsResult] = await Promise.allSettled([
          profileApi.getProfile(),
          postApi.getPosts({
            author_user_id: currentUser.id,
            limit: INITIAL_POSTS,
            offset: 0
          })
        ]);

        // プロフィールの結果を処理
        if (isMounted && profileResult.status === 'fulfilled' && profileResult.value) {
          setProfile(profileResult.value);
        }

        // 投稿の結果を処理
        if (isMounted && postsResult.status === 'fulfilled') {
          const postsArray = Array.isArray(postsResult.value) ? postsResult.value : [];
          setPosts(postsArray);
          setPostsOffset(INITIAL_POSTS);
          setHasMorePosts(postsArray.length >= INITIAL_POSTS);
        }
      } catch (error) {
        // Failed to fetch profile data - continue without data
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, authLoading]);

  useEffect(() => {
    if (currentUser?.id && activeTab === 'watching') {
      loadWatchingPosts();
    }
  }, [currentUser?.id, activeTab]);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  const loadWatchingPosts = async (loadMore = false) => {
    if (!currentUser?.id) {
      return;
    }

    try {
      setIsLoadingWatching(true);

      const offset = loadMore ? watchingOffset : 0;
      // 初回は少数、追加読み込みは通常数を取得
      const limit = loadMore ? POSTS_PER_PAGE : INITIAL_POSTS;
      const { supabase } = await import('@/lib/supabase');

      // ページネーション付きでアクティブビューを取得
      const { data: activeViews, error: activeViewError } = await supabase
        .from('product_active_views')
        .select('post_id, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (activeViewError) {
        if (!loadMore) setWatchingPosts([]);
        return;
      }

      if (!activeViews || activeViews.length === 0) {
        setHasMoreWatching(false);
        if (!loadMore) setWatchingPosts([]);
        return;
      }

      // これ以上データがないかチェック
      if (activeViews.length < limit) {
        setHasMoreWatching(false);
      }

      // アクティブビューの投稿IDを取得
      const postIds = activeViews.map(av => av.post_id);

      // 投稿の詳細を一括取得（N+1問題を回避、必要なフィールドのみ取得）
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          app_categories,
          eyecatch_url,
          price,
          monthly_revenue,
          monthly_cost,
          updated_at,
          author_user_id,
          type,
          is_active,
          created_at
        `)
        .in('id', postIds);

      if (postsError) {
        if (!loadMore) setWatchingPosts([]);
        return;
      }

      // アクティブビュー数を取得（既に取得したactiveViewsデータを再利用 - スケーラビリティ改善）
      // 注: 全ユーザーのビュー数が必要な場合は別途APIで集計データを取得する必要がある
      // 現在は閲覧中の投稿なので各投稿に1つのビューがあることが保証されている
      const activeViewCountMap = new Map<string, number>();
      // ページネーションされたactiveViewsは現在のユーザーのビューのみなので、
      // 正確なビュー数が必要な場合はバックエンドでGROUP BYを使用すべき
      // ここでは簡易的に1としてマーク（または別途API追加が必要）
      postIds.forEach(postId => {
        activeViewCountMap.set(postId, 1); // 最低1（現在のユーザー）
      });

      // 画像パスを収集して署名付きURLを取得
      const imagePaths = (posts || []).map(post => post.eyecatch_url).filter((path): path is string => !!path);
      const imageUrlMap = imagePaths.length > 0 ? await getImageUrls(imagePaths) : new Map();

      // 投稿データに画像URLと計算フィールドを追加
      const typedPosts: Post[] = (posts || []).map(post => {
        const imageUrl = post.eyecatch_url ? 
          (imageUrlMap.get(post.eyecatch_url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image') :
          'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
        
        const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
          ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
          : undefined;

        return {
          ...post,
          image_url: imageUrl,
          image_path: post.eyecatch_url || null,
          desired_price: post.price || 0,
          profit_margin: profitMargin,
          status: post.is_active ? '募集中' : '成約済み',
          active_view_count: activeViewCountMap.get(post.id) || 0
        } as Post;
      });

      if (loadMore) {
        setWatchingPosts(prev => [...prev, ...typedPosts]);
        setWatchingOffset(offset + typedPosts.length);
      } else {
        setWatchingPosts(typedPosts);
        setWatchingOffset(typedPosts.length);
      }
    } catch (err) {
      if (!loadMore) setWatchingPosts([]);
    } finally {
      setIsLoadingWatching(false);
    }
  };

  const loadMorePosts = async () => {
    if (!currentUser?.id || isLoadingPosts || !hasMorePosts) {
      return;
    }

    try {
      setIsLoadingPosts(true);
      const morePosts = await postApi.getPosts({
        author_user_id: currentUser.id,
        limit: POSTS_PER_PAGE,
        offset: postsOffset
      });

      const newPosts = Array.isArray(morePosts) ? morePosts : [];
      setPosts(prev => [...prev, ...newPosts]);
      // 実際に取得したデータ数でoffsetを更新
      setPostsOffset(prev => prev + newPosts.length);
      setHasMorePosts(newPosts.length >= POSTS_PER_PAGE);
    } catch (error) {
      // Failed to load more posts - silently fail
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      await postApi.deletePost(postId);

      // ローカル状態から削除
      setPosts(prev => prev.filter(p => p.id !== postId));
      setWatchingPosts(prev => prev.filter(p => p.id !== postId));

      setDeleteConfirmId(null);
      setOpenMenuId(null);
    } catch (error) {
      alert(t('errors.deleteFailed') || '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getJoinDate = () => {
    if (!profile?.created_at) return '';
    const date = new Date(profile.created_at);
    if (locale === 'ja') {
      return tp('profileJoinDate').replace('{year}', date.getFullYear().toString()).replace('{month}', (date.getMonth() + 1).toString());
    } else {
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      return tp('profileJoinDate').replace('{month}', monthName).replace('{year}', date.getFullYear().toString());
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'board':
        return tp('board');
      case 'transaction':
        return tp('transaction');
      case 'secret':
        return tp('secret');
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

  const filteredPosts = useMemo(() => {
    if (activeTab === 'watching') return watchingPosts;
    if (activeTab === 'all') return posts;
    return posts.filter(post => post.type === activeTab);
  }, [activeTab, watchingPosts, posts]);

  // 認証チェック中は何も表示しない（リダイレクト判定中）
  if (authGuardLoading || loading) {
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

  if (!profile || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">{tp('profileNotFound')}</p>
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            {tp('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* ヘッダー */}
      <div className="sticky top-16 bg-white z-10 border-b border-gray-200">
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
              <p className="text-sm text-gray-500">{posts.length} {tp('posts')}</p>
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
          <div className="flex gap-2 mb-4">
            <Link
              href="/settings/profile"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-center"
            >
              {tp('editProfile')}
            </Link>
          </div>
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
                {profile.role === 'seller' ? tp('seller') : tp('buyer')}
              </span>
              <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                {profile.party === 'organization' ? tp('organization') : tp('individual')}
              </span>
              {profile.nda_flag && (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-700">
                  {tp('ndaSigned')}
                </span>
              )}
            </div>
            {profile.age && (
              <div className="text-sm text-gray-600">
                {tp('age')}: {profile.age}{tp('yearsOld')}
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
            { id: 'all' as const, label: tp('all'), count: posts.length },
            { id: 'board' as const, label: tp('board'), count: posts.filter((p: Post) => p.type === 'board').length },
            { id: 'transaction' as const, label: tp('transaction'), count: posts.filter((p: Post) => p.type === 'transaction').length },
            { id: 'secret' as const, label: tp('secret'), count: posts.filter((p: Post) => p.type === 'secret').length },
            { id: 'watching' as const, label: t('common.watching'), count: watchingPosts.length },
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
          {activeTab === 'watching' ? (
            <div>
              {isLoadingWatching && watchingPosts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <p className="ml-3 text-gray-600">{t('common.loading')}</p>
                </div>
              ) : watchingPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchingPosts.map((post) => (
                      <ProjectCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        category={post.app_categories || []}
                        image={post.image_url || ''}
                        imagePath={post.image_path || null}
                        price={post.desired_price || 0}
                        monthlyRevenue={post.monthly_revenue}
                        monthlyCost={post.monthly_cost}
                        profitMargin={post.profit_margin}
                        status={post.status}
                        updatedAt={post.updated_at}
                        authorProfile={post.author_profile}
                        activeViewCount={post.active_view_count}
                      />
                    ))}
                  </div>
                  {hasMoreWatching && (
                    <div className="flex justify-center mt-8">
                      <Button
                        onClick={() => loadWatchingPosts(true)}
                        disabled={isLoadingWatching}
                        variant="outline"
                        className="px-8"
                      >
                        {isLoadingWatching ? t('common.loading') : t('common.loadMore')}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white p-8 rounded-sm text-center">
                  <p className="text-gray-500">{t('common.noProductsWatched')}</p>
                  <Button
                    onClick={() => router.push('/')}
                    className="mt-4"
                    style={{
                      backgroundColor: '#E65D65',
                      color: '#fff'
                    }}
                  >
                    {t('common.exploreProducts')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-0">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {activeTab === 'all' 
                      ? tp('noPosts')
                      : tp('noPostsInCategory').replace('{category}', getPostTypeLabel(activeTab))}
                  </p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative border-b border-gray-200 py-4 px-4 hover:bg-gray-50 transition-colors"
                >
                  {/* 三点メニュー */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === post.id ? null : post.id);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      aria-label="メニュー"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* ドロップダウンメニュー */}
                    {openMenuId === post.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(post.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>

                  <Link href={`/projects/${post.id}`} className="block">
                    <div className="flex items-start space-x-3 pr-10">
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
                                {tp('budget')}: ¥{post.budget_min?.toLocaleString()} - ¥{post.budget_max?.toLocaleString()}
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
                      {post.cover_image_url && (
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
                          🔒 {tp('priceOnly')}
                        </div>
                      )}
                      {post.secret_visibility === 'hidden' && (
                        <div className="mt-2 text-xs text-purple-600">
                          🔒 {tp('hidden')}
                        </div>
                      )}
                    </div>
                  </div>
                  </Link>
                </div>
              ))
              )}

              {/* 削除確認モーダル */}
              {deleteConfirmId && (
                <div
                  className="fixed inset-0 flex items-center justify-center z-50 py-12 sm:px-6"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                  onClick={() => !isDeleting && setDeleteConfirmId(null)}
                >
                  <div
                    className="bg-white py-8 px-4 sm:px-10 rounded-md w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2
                        className="text-lg font-bold text-center flex-1"
                        style={{
                          color: '#323232',
                          fontWeight: 900,
                          fontSize: '1.125rem',
                          letterSpacing: '0.02em'
                        }}
                      >
                        投稿を削除しますか？
                      </h2>
                      <button
                        onClick={() => !isDeleting && setDeleteConfirmId(null)}
                        disabled={isDeleting}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="mb-6">
                      <p
                        className="text-sm"
                        style={{ color: '#323232' }}
                      >
                        この操作は取り消せません。本当に削除してよろしいですか？
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={() => handleDeletePost(deleteConfirmId)}
                        disabled={isDeleting}
                        className="w-full"
                        style={{
                          backgroundColor: isDeleting ? '#9CA3AF' : '#DC2626',
                          color: '#fff'
                        }}
                      >
                        {isDeleting ? '削除中...' : '削除'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteConfirmId(null)}
                        disabled={isDeleting}
                        className="w-full"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {/* もっと見るボタン (スケーラビリティ改善: ページネーション対応) */}
              {(activeTab === 'all' || activeTab === 'board' || activeTab === 'transaction' || activeTab === 'secret') && hasMorePosts && filteredPosts.length > 0 && (
                <div className="flex justify-center py-6">
                  <Button
                    onClick={loadMorePosts}
                    disabled={isLoadingPosts}
                    variant="outline"
                    className="px-8"
                  >
                    {isLoadingPosts ? t('common.loading') : t('common.loadMore')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}