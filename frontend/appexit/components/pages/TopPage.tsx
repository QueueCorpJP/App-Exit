'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ProjectCard from '../ui/ProjectCard';
import InfiniteCarousel from '../ui/InfiniteCarousel';
import { getImageUrls } from '@/lib/storage';
import { postApi, Post } from '@/lib/api-client';
import { mockCarouselData } from '@/data/mock-carousel';

interface ProjectWithImage {
  id: string;
  title: string;
  category: string | string[];
  image: string;
  imagePath: string | null; // Storage内のパス
  price: number; // 希望価格
  monthlyRevenue?: number; // 月商
  monthlyCost?: number; // 月間コスト
  profitMargin?: number; // 利益率
  status?: string; // 成約状況
  watchCount?: number; // ウォッチ数
  commentCount?: number; // コメント数
  updatedAt?: string; // 更新日
  tag?: string;
  badge?: string;
  activeViewCount?: number; // アクティブビュー数
  authorProfile?: {
    id: string;
    display_name: string;
    icon_url?: string;
    role: string;
    party: string;
  } | null;
}

interface TopPageProps {
  initialPosts?: Post[];
  useMockCarousel?: boolean; // モックデータを使用するかどうか
  pageDict?: Record<string, any>; // ページ専用辞書（動的ロード）
}

export default function TopPage({ initialPosts = [], useMockCarousel = true, pageDict = {} }: TopPageProps) {
  const t = useTranslations(); // common辞書用
  const tHome = useTranslations('home'); // home翻訳用
  const locale = useLocale();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [latestProjects, setLatestProjects] = useState<ProjectWithImage[]>([]);
  const [subscribedProjects, setSubscribedProjects] = useState<ProjectWithImage[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(false); // Server Componentから初期データが渡されるためfalse

  // モックデータをカルーセル用にフォーマット（useMemoでメモ化）
  const mockCarouselProjects: ProjectWithImage[] = useMemo(() => {
    if (!useMockCarousel) return [];

    return mockCarouselData.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      image: item.image,
      imagePath: null,
      price: item.price,
      monthlyRevenue: undefined,
      monthlyCost: undefined,
      profitMargin: undefined,
      status: t('common.recruiting'),
      watchCount: undefined,
      commentCount: undefined,
      updatedAt: undefined,
    }));
  }, [useMockCarousel, t]);

  // スケーラビリティ改善: 投稿データからプロジェクトデータへの変換を関数化して重複を削減
  const transformPostToProject = (post: Post, imageUrl?: string): ProjectWithImage => {
    // カテゴリの取得（app_categoriesの配列、なければbody）
    const categories = post.app_categories && post.app_categories.length > 0
      ? post.app_categories
      : [post.body || t('topPageProject')];

    // 利益率の計算
    const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
      ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
      : undefined;

    // 成約状況
    const status = post.is_active ? t('common.recruiting') : t('common.completed');

    return {
      id: post.id,
      title: post.title,
      category: categories,
      image: imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image',
      imagePath: post.eyecatch_url || null,
      price: post.price || 0,
      monthlyRevenue: post.monthly_revenue,
      monthlyCost: post.monthly_cost,
      profitMargin,
      status,
      watchCount: undefined,
      commentCount: undefined,
      updatedAt: post.updated_at,
      tag: undefined,
      badge: undefined,
      activeViewCount: post.active_view_count || 0,
      authorProfile: post.author_profile || null,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPostsAndImages = async () => {
      try {
        // Server Componentから渡された初期データを使用（ISR対応）
        const data = posts;

        if (!data || data.length === 0) {
          setProjects([]);
          setLoading(false);
          return;
        }

        // まず、画像なしでプロジェクトデータを作成して即座に表示
        const projectsWithoutImages: ProjectWithImage[] = data.map(post => transformPostToProject(post));

        // 最新の投稿を取得（created_atでソート）
        const sortedByDateWithoutImages = [...projectsWithoutImages].sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA; // 新しい順
        });

        // データを即座に表示して読み込みを解除
        if (isMounted) {
          setProjects(projectsWithoutImages);
          setLatestProjects(sortedByDateWithoutImages);
          setLoading(false);
        }

        // 画像パスを収集
        const imagePaths = data.map(post => post.eyecatch_url).filter((path): path is string => !!path);

        // 署名付きURLを一括取得（非同期で、エラーが発生しても続行）
        // タイムアウトを5秒に短縮
        let imageUrlMap = new Map<string, string>();
        if (imagePaths.length > 0) {
          try {
            const imageUrlPromise = getImageUrls(imagePaths);
            const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
              setTimeout(() => {
                resolve(new Map());
              }, 5000); // 5秒タイムアウト
            });

            imageUrlMap = await Promise.race([
              imageUrlPromise.catch(() => {
                return new Map<string, string>();
              }),
              timeoutPromise,
            ]);
          } catch (imageError) {
            imageUrlMap = new Map();
          }
        }

        if (!isMounted) return;

        // 画像URLを適用してプロジェクトデータを更新（画像がない場合でもスコアリングロジックを実行）
        if (imageUrlMap.size > 0) {
          const projectsWithImages: ProjectWithImage[] = data.map(post => {
            const imageUrl = post.eyecatch_url ? imageUrlMap.get(post.eyecatch_url) : undefined;
            return transformPostToProject(post, imageUrl);
          });

          // subscribe が true の投稿をフィルタリング
          const subscribed = projectsWithImages.filter((project) => {
            const post = data.find(p => p.id === project.id);
            return post && post.subscribe === true;
          });

          // 最新の投稿を取得（created_atでソート）
          const sortedByDate = [...projectsWithImages].sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA; // 新しい順
          });

          // レコメンドロジック: 改善されたスコアリングアルゴリズム
          const recommendedWithScore = [...projectsWithImages]
            .map(project => {
              const post = data.find(p => p.id === project.id);
              if (!post) return { project, score: 0, category: '' };

              // 各メトリクスの正規化用の最大値を計算
              const maxActiveViews = Math.max(...data.map(p => p.active_view_count || 0));
              const maxWatchCount = Math.max(...data.map(p => p.watch_count || 0));
              const maxCommentCount = Math.max(...data.map(p => p.comment_count || 0));

              // スコア計算（0-100の範囲に正規化）
              let score = 0;

              // 1. エンゲージメントスコア（40点満点）
              // アクティブビュー数（0-15点）
              if (maxActiveViews > 0) {
                score += ((post.active_view_count || 0) / maxActiveViews) * 15;
              }
              // ウォッチ数（0-15点） - 購買意欲の高いユーザーの指標
              if (maxWatchCount > 0) {
                score += ((post.watch_count || 0) / maxWatchCount) * 15;
              }
              // コメント数（0-10点） - アクティブな議論の指標
              if (maxCommentCount > 0) {
                score += ((post.comment_count || 0) / maxCommentCount) * 10;
              }

              // 2. 新しさスコア（20点満点）
              const createdAt = new Date(post.created_at);
              const now = new Date();
              const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff <= 3) score += 20;       // 3日以内: 20点
              else if (daysDiff <= 7) score += 15;  // 7日以内: 15点
              else if (daysDiff <= 14) score += 10; // 14日以内: 10点
              else if (daysDiff <= 30) score += 5;  // 30日以内: 5点

              // 3. 事業価値スコア（30点満点）
              if (post.price && post.price > 0) {
                // 価格設定あり: +5点
                score += 5;

                // 月次収益データがある場合
                if (post.monthly_revenue && post.monthly_revenue > 0) {
                  // 収益性評価: +10点
                  score += 10;

                  // 価格倍率（売上の何ヶ月分か）
                  const multiple = post.price / post.monthly_revenue;
                  // 適正な価格倍率（6-48ヶ月）: +10点
                  if (multiple >= 6 && multiple <= 48) score += 10;

                  // 利益率評価（月次利益データがある場合）
                  if (post.monthly_profit !== undefined && post.monthly_revenue > 0) {
                    const profitMargin = (post.monthly_profit / post.monthly_revenue) * 100;
                    if (profitMargin > 50) score += 5;      // 高利益率: +5点
                    else if (profitMargin > 20) score += 3; // 中利益率: +3点
                  }
                }
              }

              // 4. ステータススコア（10点満点）
              if (post.is_active) score += 10; // アクティブな案件のみ表示

              // カテゴリ情報を保存（多様性のため）
              const category = Array.isArray(post.app_categories) && post.app_categories.length > 0
                ? post.app_categories[0]
                : 'other';

              return { project, score, category };
            })
            .filter(item => item.score > 0); // スコア0のものは除外

          // カテゴリの多様性を確保しつつ、上位12件を選択
          const recommended: ProjectWithImage[] = [];
          const categoryCount = new Map<string, number>();
          const maxPerCategory = 4; // 1カテゴリから最大4件まで

          // まずスコア順にソート
          const sortedByScore = [...recommendedWithScore].sort((a, b) => b.score - a.score);

          // カテゴリバランスを考慮しながら選択
          for (const item of sortedByScore) {
            if (recommended.length >= 12) break;

            const currentCategoryCount = categoryCount.get(item.category) || 0;
            if (currentCategoryCount < maxPerCategory) {
              recommended.push(item.project);
              categoryCount.set(item.category, currentCategoryCount + 1);
            }
          }

          // 12件に満たない場合は、カテゴリ制限を無視して追加
          if (recommended.length < 12) {
            for (const item of sortedByScore) {
              if (recommended.length >= 12) break;
              if (!recommended.find(p => p.id === item.project.id)) {
                recommended.push(item.project);
              }
            }
          }

          if (isMounted) {
            setProjects(projectsWithImages);
            setLatestProjects(sortedByDate);
            setSubscribedProjects(subscribed);
            setRecommendedProjects(recommended);
          }
        } else {
          // 画像がない場合でもスコアリングロジックを実行
          // subscribe が true の投稿をフィルタリング
          const subscribed = projectsWithoutImages.filter((project) => {
            const post = data.find(p => p.id === project.id);
            return post && post.subscribe === true;
          });

          // レコメンドロジック: 改善されたスコアリングアルゴリズム
          const recommendedWithScore = [...projectsWithoutImages]
            .map(project => {
              const post = data.find(p => p.id === project.id);
              if (!post) return { project, score: 0, category: '' };

              // 各メトリクスの正規化用の最大値を計算
              const maxActiveViews = Math.max(...data.map(p => p.active_view_count || 0));
              const maxWatchCount = Math.max(...data.map(p => p.watch_count || 0));
              const maxCommentCount = Math.max(...data.map(p => p.comment_count || 0));

              // スコア計算（0-100の範囲に正規化）
              let score = 0;

              // 1. エンゲージメントスコア（40点満点）
              // アクティブビュー数（0-15点）
              if (maxActiveViews > 0) {
                score += ((post.active_view_count || 0) / maxActiveViews) * 15;
              }
              // ウォッチ数（0-15点） - 購買意欲の高いユーザーの指標
              if (maxWatchCount > 0) {
                score += ((post.watch_count || 0) / maxWatchCount) * 15;
              }
              // コメント数（0-10点） - アクティブな議論の指標
              if (maxCommentCount > 0) {
                score += ((post.comment_count || 0) / maxCommentCount) * 10;
              }

              // 2. 新しさスコア（20点満点）
              const createdAt = new Date(post.created_at);
              const now = new Date();
              const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDiff <= 3) score += 20;       // 3日以内: 20点
              else if (daysDiff <= 7) score += 15;  // 7日以内: 15点
              else if (daysDiff <= 14) score += 10; // 14日以内: 10点
              else if (daysDiff <= 30) score += 5;  // 30日以内: 5点

              // 3. 事業価値スコア（30点満点）
              if (post.price && post.price > 0) {
                // 価格設定あり: +5点
                score += 5;

                // 月次収益データがある場合
                if (post.monthly_revenue && post.monthly_revenue > 0) {
                  // 収益性評価: +10点
                  score += 10;

                  // 価格倍率（売上の何ヶ月分か）
                  const multiple = post.price / post.monthly_revenue;
                  // 適正な価格倍率（6-48ヶ月）: +10点
                  if (multiple >= 6 && multiple <= 48) score += 10;

                  // 利益率評価（月次利益データがある場合）
                  if (post.monthly_profit !== undefined && post.monthly_revenue > 0) {
                    const profitMargin = (post.monthly_profit / post.monthly_revenue) * 100;
                    if (profitMargin > 50) score += 5;      // 高利益率: +5点
                    else if (profitMargin > 20) score += 3; // 中利益率: +3点
                  }
                }
              }

              // 4. ステータススコア（10点満点）
              if (post.is_active) score += 10; // アクティブな案件のみ表示

              // カテゴリ情報を保存（多様性のため）
              const category = Array.isArray(post.app_categories) && post.app_categories.length > 0
                ? post.app_categories[0]
                : 'other';

              return { project, score, category };
            })
            .filter(item => item.score > 0); // スコア0のものは除外

          // カテゴリの多様性を確保しつつ、上位12件を選択
          const recommended: ProjectWithImage[] = [];
          const categoryCount = new Map<string, number>();
          const maxPerCategory = 4; // 1カテゴリから最大4件まで

          // まずスコア順にソート
          const sortedByScore = [...recommendedWithScore].sort((a, b) => b.score - a.score);

          // カテゴリバランスを考慮しながら選択
          for (const item of sortedByScore) {
            if (recommended.length >= 12) break;

            const currentCategoryCount = categoryCount.get(item.category) || 0;
            if (currentCategoryCount < maxPerCategory) {
              recommended.push(item.project);
              categoryCount.set(item.category, currentCategoryCount + 1);
            }
          }

          // 12件に満たない場合は、カテゴリ制限を無視して追加
          if (recommended.length < 12) {
            for (const item of sortedByScore) {
              if (recommended.length >= 12) break;
              if (!recommended.find(p => p.id === item.project.id)) {
                recommended.push(item.project);
              }
            }
          }

          if (isMounted) {
            setSubscribedProjects(subscribed);
            setRecommendedProjects(recommended);
          }
        }
      } catch (error) {
        if (isMounted) {
          setProjects([]);
          setLoading(false);
        }
      }
    };

    fetchPostsAndImages();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 最初のプロジェクトをfeaturedとして使用
  const featuredProject = projects.length > 0 ? projects[0] : null;
  const sideProjects = projects.slice(1, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-gray-500">{t('projects.noResults')}</div>
      </div>
    );
  }

  // カルーセルに表示するプロジェクトを決定
  const carouselItems = useMockCarousel && mockCarouselProjects.length > 0
    ? mockCarouselProjects
    : subscribedProjects;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* Infinite Carousel for Subscribed Projects */}
      {carouselItems.length > 0 && (
        <InfiniteCarousel items={carouselItems} />
      )}

      {/* Project List Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xl font-black mb-0.5 text-center" style={{ color: '#323232' }}>
            <span style={{ color: '#b91c1c' }}>R</span>ecomend
          </p>
          <h2 className="text-2xl font-black mb-8 text-center" style={{ color: '#323232' }}>{tHome('recommended')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedProjects.length > 0 ? (
              recommendedProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  category={project.category}
                  image={project.image}
                  imagePath={project.imagePath}
                  price={project.price}
                  monthlyRevenue={project.monthlyRevenue}
                  monthlyCost={project.monthlyCost}
                  profitMargin={project.profitMargin}
                  status={project.status}
                  watchCount={project.watchCount}
                  commentCount={project.commentCount}
                  updatedAt={project.updatedAt}
                  tag={project.tag}
                  badge={project.badge}
                  authorProfile={project.authorProfile}
                  activeViewCount={project.activeViewCount}
                  priority={index < 6}
                />
              ))
            ) : (
              projects.slice(0, 12).map((project, index) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  title={project.title}
                  category={project.category}
                  image={project.image}
                  imagePath={project.imagePath}
                  price={project.price}
                  monthlyRevenue={project.monthlyRevenue}
                  monthlyCost={project.monthlyCost}
                  profitMargin={project.profitMargin}
                  status={project.status}
                  watchCount={project.watchCount}
                  commentCount={project.commentCount}
                  updatedAt={project.updatedAt}
                  tag={project.tag}
                  badge={project.badge}
                  activeViewCount={project.activeViewCount}
                  authorProfile={project.authorProfile}
                  priority={index < 6}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Latest Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xl font-black mb-0.5 text-center" style={{ color: '#323232' }}>
            <span style={{ color: '#b91c1c' }}>N</span>ew
          </p>
          <h2 className="text-2xl font-black mb-8 text-center" style={{ color: '#323232' }}>{tHome('latestProducts')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                category={project.category}
                image={project.image}
                imagePath={project.imagePath}
                price={project.price}
                monthlyRevenue={project.monthlyRevenue}
                monthlyCost={project.monthlyCost}
                profitMargin={project.profitMargin}
                status={project.status}
                watchCount={project.watchCount}
                commentCount={project.commentCount}
                updatedAt={project.updatedAt}
                tag={project.tag}
                badge={project.badge}
                activeViewCount={project.activeViewCount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Project Section */}
      {featuredProject && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xl font-black mb-0.5 text-center" style={{ color: '#323232' }}>
              <span style={{ color: '#b91c1c' }}>T</span>rending
            </p>
            <h2 className="text-2xl font-black mb-8 text-center" style={{ color: '#323232' }}>{tHome('trending')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Featured Project */}
              <Link
                href={`/${locale}/projects/${featuredProject.id}`}
                className="relative h-96 rounded-sm overflow-hidden block group cursor-pointer"
              >
                <Image
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm mb-2">{featuredProject.category}</p>
                  <h2 className="text-2xl font-bold mb-4">{featuredProject.title}</h2>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-bold text-2xl">{featuredProject.price.toLocaleString()}{t('common.jpyCurrency')}</span>
                    </div>
                    {featuredProject.monthlyRevenue && (
                      <div>
                        <span className="opacity-80">{tHome('monthlyRevenue')}</span>
                        <span className="font-semibold ml-1">{featuredProject.monthlyRevenue.toLocaleString()}{t('common.jpyCurrency')}</span>
                      </div>
                    )}
                    {featuredProject.profitMargin !== undefined && featuredProject.profitMargin > 0 && (
                      <div>
                        <span className="opacity-80">{tHome('profitMargin')}</span>
                        <span className="font-semibold ml-1">{featuredProject.profitMargin.toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Side Projects Grid */}
              {sideProjects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sideProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/${locale}/projects/${project.id}`}
                      className="relative h-44 rounded-sm overflow-hidden block group cursor-pointer"
                    >
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {project.badge && (
                        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs font-medium">
                          {project.badge}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-xs mb-1 line-clamp-2">{project.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold">{project.price.toLocaleString()}{t('common.jpyCurrency')}</span>
                          {project.monthlyRevenue && (
                            <span>{tHome('monthlyRevenue')}{project.monthlyRevenue.toLocaleString()}{t('common.jpyCurrency')}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
