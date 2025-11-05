'use client';

import { useEffect, useState } from 'react';
import { getImageUrls } from '@/lib/storage';
import ProjectCard from '@/components/ui/ProjectCard';
import { postApi, Post, AuthorProfile } from '@/lib/api-client';

interface ProjectWithImage {
  id: string;
  title: string;
  category: string;
  image: string;
  imagePath: string | null;
  supporters: number;
  daysLeft: number;
  amountRaised: number;
  tag?: string;
  badge?: string;
  authorProfile?: AuthorProfile | null;
}

type PostType = 'all' | 'board' | 'transaction' | 'secret';

export default function ProjectsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PostType>('all');

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // バックエンドAPI経由で投稿を取得
      const params = activeTab !== 'all' ? { type: activeTab } : undefined;
      const data = await postApi.getPosts(params);

      if (data.length === 0) {
        console.log('No posts found');
        setProjects([]);
        setLoading(false);
        return;
      }

      setPosts(data);

      // 画像パスを収集
      const imagePaths = data.map(post => post.cover_image_url).filter((path): path is string => !!path);
      console.log('[PROJECTS-LIST] Image paths:', imagePaths);

      // 署名付きURLを一括取得
      const imageUrlMap = await getImageUrls(imagePaths);
      console.log('[PROJECTS-LIST] Image URL map size:', imageUrlMap.size);

      // プロジェクトデータに画像URLを追加
      const projectsWithImages: ProjectWithImage[] = data.map(post => {
        const imageUrl = post.cover_image_url ?
          (imageUrlMap.get(post.cover_image_url) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image') :
          'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

        // タイプに応じたバッジを設定
        let badge: string | undefined;
        if (post.type === 'board') badge = '掲示板';
        else if (post.type === 'secret') badge = 'シークレット';
        else if (post.type === 'transaction') badge = '取引';

        return {
          id: post.id,
          title: post.title,
          category: post.body || '',
          image: imageUrl,
          imagePath: post.cover_image_url,
          supporters: 0,
          daysLeft: Math.max(30 - Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)), 1),
          amountRaised: post.price || post.budget_max || post.budget_min || 0,
          badge,
          authorProfile: post.author_profile,
        };
      });

      console.log('[PROJECTS-LIST] Projects with images:', projectsWithImages);
      setProjects(projectsWithImages);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">プロダクトを探す</h1>

          {/* タブナビゲーション */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                すべて
              </button>
              <button
                onClick={() => setActiveTab('transaction')}
                className={`${
                  activeTab === 'transaction'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                取引投稿
              </button>
              <button
                onClick={() => setActiveTab('board')}
                className={`${
                  activeTab === 'board'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                掲示板
              </button>
              <button
                onClick={() => setActiveTab('secret')}
                className={`${
                  activeTab === 'secret'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                シークレット
              </button>
            </nav>
          </div>
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        )}

        {/* プロジェクト一覧 */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">投稿が見つかりませんでした</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
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
                authorProfile={project.authorProfile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
