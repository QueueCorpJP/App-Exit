import TopPage from '@/components/pages/TopPage';
import { Post } from '@/lib/api-client';

async function getPosts(): Promise<Post[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiUrl}/api/posts?type=transaction&sort=recommended&limit=6`, {
      next: { revalidate: 600 }, // 600秒（10分）キャッシュ
    });

    if (!response.ok) {
      console.error('Failed to fetch posts:', response.status);
      return [];
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export default async function Home() {
  // Server Componentで初期データを取得
  const initialPosts = await getPosts();

  return <TopPage initialPosts={initialPosts} useMockCarousel={true} />;
}
