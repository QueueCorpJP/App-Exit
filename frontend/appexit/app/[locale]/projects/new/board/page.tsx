import dynamicImport from 'next/dynamic';

const PostBoardPage = dynamicImport(() => import('@/components/pages/PostBoardPage'), {
  ssr: true,
});

// このページは動的にレンダリングする
export const dynamic = 'force-dynamic';

interface Post {
  id: string;
  title: string;
  body?: string;
  eyecatch_url?: string;
  author_user_id: string;
  created_at: string;
  type: string;
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

// サーバーコンポーネントで投稿を取得
async function getPosts(): Promise<Post[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    const response = await fetch(`${apiUrl}/api/posts?type=board`, {
      cache: 'no-store', // 常に最新データを取得
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    // レスポンス形式を処理
    if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
      return result.data || [];
    }

    if (Array.isArray(result)) {
      return result;
    }

    return [];
  } catch (error) {
    return [];
  }
}

// 右サイドバー用のデータを取得（GoバックエンドAPIから取得）
async function getSidebarData(): Promise<SidebarData | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    const response = await fetch(`${apiUrl}/api/posts/board/sidebar`, {
      cache: 'no-store', // 常に最新データを取得
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    // レスポンス形式を処理
    if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
      return result.data;
    }

    if (result && typeof result === 'object' && 'stats' in result) {
      return result;
    }

    return null;
  } catch (error) {
    return null;
  }
}

import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function NewBoardPost({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const initialPosts = await getPosts();
  const sidebarData = await getSidebarData();
  const boardDict = await loadPageDictionary(locale, 'board');

  return <PostBoardPage initialPosts={initialPosts} sidebarData={sidebarData ?? undefined} pageDict={boardDict} />;
}
