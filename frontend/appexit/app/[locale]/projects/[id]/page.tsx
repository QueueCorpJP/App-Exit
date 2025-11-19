import ProjectDetailPage from '@/components/pages/ProjectDetailPage';
import type { Locale } from '@/i18n/config';
import { loadPageDictionary } from '@/lib/i18n-utils';

interface PageProps {
  params: Promise<{
    id: string;
    locale: Locale;
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

  if (id === 'new') {
    return <div>404 - Not Found</div>;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  let postDetails = null;

  try {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const data = await response.json();
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
