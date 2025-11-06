import ProjectDetailPage from '@/components/pages/ProjectDetailPage';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    title?: string;
    category?: string;
    imagePath?: string;
    price?: string;
    status?: string;
  }>;
}

export default async function ProjectDetail({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { title, category, imagePath, price, status } = await searchParams;

  // idが"new"の場合は404を返す（静的ルート/projects/newが優先されるべき）
  if (id === 'new') {
    return <div>404 - Not Found</div>;
  }

  // APIから詳細情報を取得
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  let postDetails = null;

  try {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      // バックエンドのレスポンス構造を確認（PostWithDetailsは埋め込み構造体なのでフラット）
      postDetails = data;
    }
  } catch (error) {
    console.error('Failed to fetch post details:', error);
  }

  return (
      <ProjectDetailPage
        projectId={id}
        initialData={{
          title,
          category,
          imagePath,
          price: price ? parseInt(price) : undefined,
          status,
        }}
        postDetails={postDetails}
      />
  );
}
