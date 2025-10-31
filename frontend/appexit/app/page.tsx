import TopPage from '@/components/pages/TopPage';

// キャッシュ設定: 60秒ごとに再検証
export const revalidate = 60;

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

async function getPosts(): Promise<Post[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${apiUrl}/api/posts?type=transaction`, {
      next: { revalidate: 60 }, // 60秒キャッシュ
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

  return <TopPage initialPosts={initialPosts} />;
}
