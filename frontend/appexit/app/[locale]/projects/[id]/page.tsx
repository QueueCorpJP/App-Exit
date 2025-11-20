import ProjectDetailPage from '@/components/pages/ProjectDetailPage';
import type { Locale } from '@/i18n/config';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Metadata } from 'next';

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

// 投稿データの型定義
interface PostData {
  data?: {
    title?: string;
    body?: string;
    type?: string;
    price?: number;
    eyecatch_url?: string;
  };
}

// メタデータを動的に生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    const response = await fetch(`${API_URL}/api/posts/${id}`, {
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const postData: PostData = await response.json();
      const post = postData.data;

      if (post) {
        // タイトル: {post.title} - M&A募集
        const title = `${post.title || 'プロジェクト'} - M&A募集`;

        // メタディスクリプション: プロジェクトの説明（最大160文字）
        // bodyフィールドからHTMLタグを除去して使用
        let cleanDescription = '';
        if (post.body) {
          // HTMLタグを除去
          cleanDescription = post.body.replace(/<[^>]*>/g, '').trim();
          // 160文字に制限
          if (cleanDescription.length > 160) {
            cleanDescription = cleanDescription.substring(0, 160) + '...';
          }
        }

        const description = cleanDescription ||
          `${post.title || 'プロジェクト'}のM&A募集情報。${post.type ? post.type + 'タイプ。' : ''}詳細はこちらをご覧ください。`;

        // OG画像のURL
        const imageUrl = post.eyecatch_url
          ? post.eyecatch_url.startsWith('http')
            ? post.eyecatch_url
            : `https://appexit.jp${post.eyecatch_url}`
          : 'https://appexit.jp/og-image.png';

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            type: 'article',
            locale: locale === 'ja' ? 'ja_JP' : 'en_US',
            url: `https://appexit.jp/${locale}/projects/${id}`,
            siteName: 'APPEXIT',
            images: [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: post.title || 'APPEXIT M&A募集',
              },
            ],
          },
          twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
          },
          alternates: {
            canonical: `https://appexit.jp/${locale}/projects/${id}`,
            languages: {
              'ja': `https://appexit.jp/ja/projects/${id}`,
              'en': `https://appexit.jp/en/projects/${id}`,
            },
          },
        };
      }
    }
  } catch (error) {
    // Failed to generate metadata - use fallback
  }

  // フォールバック（投稿が見つからない場合）
  return {
    title: 'プロジェクト詳細 - M&A募集 | APPEXIT',
    description: 'M&A募集プロジェクトの詳細情報をご覧いただけます。',
  };
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
    // Failed to fetch post details - use initialData
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
