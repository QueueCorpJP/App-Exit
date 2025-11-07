'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProjectCard from '../ui/ProjectCard';
import InfiniteCarousel from '../ui/InfiniteCarousel';
import { getImageUrls } from '@/lib/storage';
import { postApi, Post } from '@/lib/api-client';
import { mockCarouselData } from '@/data/mock-carousel';

interface ProjectWithImage {
  id: string;
  title: string;
  category: string;
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
}

interface TopPageProps {
  initialPosts?: Post[];
  useMockCarousel?: boolean; // モックデータを使用するかどうか
}

export default function TopPage({ initialPosts = [], useMockCarousel = true }: TopPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [subscribedProjects, setSubscribedProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  // モックデータをカルーセル用にフォーマット
  const mockCarouselProjects: ProjectWithImage[] = useMockCarousel
    ? mockCarouselData.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image,
        imagePath: null,
        price: item.price,
        monthlyRevenue: undefined,
        monthlyCost: undefined,
        profitMargin: undefined,
        status: '募集中',
        watchCount: undefined,
        commentCount: undefined,
        updatedAt: undefined,
      }))
    : [];

  useEffect(() => {
    let isMounted = true;

    const fetchPostsAndImages = async () => {
      try {
        // 初期データがある場合は、それを使用してAPIコールをスキップ
        let data = posts;

        if (data.length === 0) {
          setLoading(true);
          // 初期データがない場合のみAPIから取得
          const response = await postApi.getPosts({ type: 'transaction' });

          if (!isMounted) return;

          // バックエンドレスポンスから data を取り出す
          data = response?.data || [];

          if (!data || data.length === 0) {
            console.log('No posts found');
            setProjects([]);
            setLoading(false);
            return;
          }

          setPosts(data);
        }

        // まず、画像なしでプロジェクトデータを作成して即座に表示
        const projectsWithoutImages: ProjectWithImage[] = data.map(post => {
          // カテゴリの取得（app_categoriesの最初の項目、なければbody）
          const category = post.app_categories && post.app_categories.length > 0
            ? post.app_categories[0]
            : (post.body || 'プロジェクト');

          // 利益率の計算
          const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
            ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
            : undefined;

          // 成約状況
          const status = post.is_active ? '募集中' : '成約済み';

          return {
            id: post.id,
            title: post.title,
            category,
            image: 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image',
            imagePath: post.eyecatch_url || null,
            price: post.price || 0,
            monthlyRevenue: post.monthly_revenue,
            monthlyCost: post.monthly_cost,
            profitMargin,
            status,
            watchCount: undefined, // 今後実装予定
            commentCount: undefined, // 今後実装予定
            updatedAt: post.updated_at,
            tag: undefined,
            badge: undefined,
            activeViewCount: post.active_view_count || 0, // バックエンドから取得したアクティブビュー数
          };
        });

        // データを即座に表示して読み込みを解除
        if (isMounted) {
          setProjects(projectsWithoutImages);
          setLoading(false);
        }

        // 画像パスを収集
        const imagePaths = data.map(post => post.eyecatch_url).filter((path): path is string => !!path);
        console.log('[TOP-PAGE] Total posts:', data.length);
        console.log('[TOP-PAGE] Image paths:', imagePaths);
        console.log('[TOP-PAGE] Number of valid image paths:', imagePaths.length);

        // 画像がない場合はスキップ
        if (imagePaths.length === 0) {
          console.log('[TOP-PAGE] No images to fetch');
          return;
        }

        // 署名付きURLを一括取得（非同期で、エラーが発生しても続行）
        // タイムアウトを5秒に短縮
        let imageUrlMap = new Map<string, string>();
        try {
          const imageUrlPromise = getImageUrls(imagePaths);
          const timeoutPromise = new Promise<Map<string, string>>((resolve) => {
            setTimeout(() => {
              console.warn('[TOP-PAGE] getImageUrls timeout after 5s, using empty map');
              resolve(new Map());
            }, 5000); // 5秒タイムアウト
          });

          imageUrlMap = await Promise.race([
            imageUrlPromise.catch((err) => {
              console.error('[TOP-PAGE] getImageUrls promise rejected:', err);
              return new Map<string, string>();
            }),
            timeoutPromise,
          ]);
        } catch (imageError) {
          console.error('[TOP-PAGE] Error getting image URLs:', imageError);
          imageUrlMap = new Map();
        }

        if (!isMounted) return;

        console.log('[TOP-PAGE] Image URL map size:', imageUrlMap.size);

        // 画像URLが取得できた場合は、プロジェクトデータを更新
        if (imageUrlMap.size > 0) {
          const projectsWithImages: ProjectWithImage[] = data.map(post => {
            const imageUrl = post.eyecatch_url
              ? (imageUrlMap.get(post.eyecatch_url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image')
              : 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

            // カテゴリの取得（app_categoriesの最初の項目、なければbody）
            const category = post.app_categories && post.app_categories.length > 0
              ? post.app_categories[0]
              : (post.body || 'プロジェクト');

            // 利益率の計算
            const profitMargin = post.monthly_revenue && post.monthly_cost !== undefined && post.monthly_revenue > 0
              ? ((post.monthly_revenue - post.monthly_cost) / post.monthly_revenue) * 100
              : undefined;

            // 成約状況
            const status = post.is_active ? '募集中' : '成約済み';

            return {
              id: post.id,
              title: post.title,
              category,
              image: imageUrl,
              imagePath: post.eyecatch_url || null,
              price: post.price || 0,
              monthlyRevenue: post.monthly_revenue,
              monthlyCost: post.monthly_cost,
              profitMargin,
              status,
              watchCount: undefined, // 今後実装予定
              commentCount: undefined, // 今後実装予定
              updatedAt: post.updated_at,
              tag: undefined,
              badge: undefined,
              activeViewCount: post.active_view_count || 0, // バックエンドから取得したアクティブビュー数
            };
          });

          // subscribe が true の投稿をフィルタリング
          const subscribed = projectsWithImages.filter((project) => {
            const post = data.find(p => p.id === project.id);
            return post && post.subscribe === true;
          });

          if (isMounted) {
            setProjects(projectsWithImages);
            setSubscribedProjects(subscribed);
          }
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
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
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-gray-500">プロジェクトがありません</div>
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
          <h2 className="text-2xl font-black mb-8 text-center" style={{ color: '#323232' }}>おすすめプロダクト</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
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
            <h2 className="text-2xl font-black mb-8 text-center" style={{ color: '#323232' }}>急上昇中</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Featured Project */}
              <Link
                href={`/projects/${featuredProject.id}`}
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
                      <span className="font-bold text-2xl">{featuredProject.price.toLocaleString()}円</span>
                    </div>
                    {featuredProject.monthlyRevenue && (
                      <div>
                        <span className="opacity-80">月商</span>
                        <span className="font-semibold ml-1">{featuredProject.monthlyRevenue.toLocaleString()}円</span>
                      </div>
                    )}
                    {featuredProject.profitMargin !== undefined && featuredProject.profitMargin > 0 && (
                      <div>
                        <span className="opacity-80">利益率</span>
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
                      href={`/projects/${project.id}`}
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
                          <span className="font-semibold">{project.price.toLocaleString()}円</span>
                          {project.monthlyRevenue && (
                            <span>月商{project.monthlyRevenue.toLocaleString()}円</span>
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
