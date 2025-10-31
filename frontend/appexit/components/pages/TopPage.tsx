'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import ProjectCard from '../ui/ProjectCard';
import { getImageUrls } from '@/lib/storage';
import { postApi } from '@/lib/api-client';

interface Post {
  id: string;
  title: string;
  body: string | null;
  cover_image_url: string | null;
  price: number | null;
  budget_max: number | null;
  updated_at: string;
  created_at: string;
}

interface ProjectWithImage {
  id: string;
  title: string;
  category: string;
  image: string;
  imagePath: string | null; // Storage内のパス
  supporters: number;
  daysLeft: number;
  amountRaised: number;
  tag?: string;
  badge?: string;
}

interface TopPageProps {
  initialPosts?: Post[];
}

export default function TopPage({ initialPosts = [] }: TopPageProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  useEffect(() => {
    let isMounted = true;

    const fetchPostsAndImages = async () => {
      try {
        // 初期データがある場合は、それを使用してAPIコールをスキップ
        let data = posts;

        if (data.length === 0) {
          setLoading(true);
          // 初期データがない場合のみAPIから取得
          data = await postApi.getPosts({ type: 'transaction' });

          if (!isMounted) return;

          if (!data || data.length === 0) {
            console.log('No posts found');
            setProjects([]);
            setLoading(false);
            return;
          }

          setPosts(data);
        }

        // まず、画像なしでプロジェクトデータを作成して即座に表示
        const projectsWithoutImages: ProjectWithImage[] = data.map(post => ({
          id: post.id,
          title: post.title,
          category: post.body || 'プロジェクト',
          image: 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image',
          imagePath: post.cover_image_url,
          supporters: 0,
          daysLeft: Math.max(30 - Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)), 1),
          amountRaised: post.price || post.budget_max || 0,
          tag: undefined,
          badge: undefined,
        }));

        // データを即座に表示して読み込みを解除
        if (isMounted) {
          setProjects(projectsWithoutImages);
          setLoading(false);
        }

        // 画像パスを収集
        const imagePaths = data.map(post => post.cover_image_url).filter((path): path is string => !!path);
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
            const imageUrl = post.cover_image_url 
              ? (imageUrlMap.get(post.cover_image_url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image')
              : 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

            return {
              id: post.id,
              title: post.title,
              category: post.body || 'プロジェクト',
              image: imageUrl,
              imagePath: post.cover_image_url,
              supporters: 0,
              daysLeft: Math.max(30 - Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)), 1),
              amountRaised: post.price || post.budget_max || 0,
              tag: undefined,
              badge: undefined,
            };
          });

          if (isMounted) {
            setProjects(projectsWithImages);
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      {/* Featured Project Section */}
      {featuredProject && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Main Featured Project */}
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src={featuredProject.image}
                  alt={featuredProject.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-sm mb-2">{featuredProject.category}</p>
                  <h2 className="text-2xl font-bold mb-4">{featuredProject.title}</h2>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-bold text-2xl">{featuredProject.amountRaised.toLocaleString()}</span>
                      <span className="ml-1">円</span>
                    </div>
                    <div>
                      <span className="opacity-80">支援</span>
                      <span className="font-semibold ml-1">{featuredProject.supporters}人</span>
                    </div>
                    <div>
                      <span className="opacity-80">残り</span>
                      <span className="font-semibold ml-1">{featuredProject.daysLeft}日</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Projects Grid */}
              {sideProjects.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {sideProjects.map((project) => (
                <div key={project.id} className="relative h-44 rounded-lg overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
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
                      <span>{project.supporters}人</span>
                      <span>残り{project.daysLeft}日</span>
                      <span className="font-semibold">{project.amountRaised.toLocaleString()}円</span>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Project List Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                category={project.category}
                image={project.image}
                imagePath={project.imagePath}
                supporters={project.supporters}
                daysLeft={project.daysLeft}
                amountRaised={project.amountRaised}
                tag={project.tag}
                badge={project.badge}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Side Banner */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-red-600 text-white writing-mode-vertical-rl px-3 py-6 text-sm font-medium rounded-l-lg">
          クラウドファンディングで最初の一歩を踏み出そう
        </div>
      </div>
    </div>
  );
}
