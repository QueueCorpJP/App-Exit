import PostBoardPage from '@/components/pages/PostBoardPage';

interface Post {
  id: string;
  title: string;
  body: string | null;
  cover_image_url: string | null;
  author_user_id: string;
  created_at: string;
  type: string;
}

// サーバーコンポーネントで投稿を取得
async function getPosts(): Promise<Post[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    const response = await fetch(`${apiUrl}/api/posts?type=board`, {
      cache: 'no-store', // 常に最新データを取得
    });

    if (!response.ok) {
      console.error('[SERVER] Failed to fetch posts:', response.status);
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
    console.error('[SERVER] Error fetching posts:', error);
    return [];
  }
}

export default async function NewBoardPost() {
  const initialPosts = await getPosts();

  return <PostBoardPage initialPosts={initialPosts} />;
}
