import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginPageClient from '@/components/pages/LoginPageClient';
import type { Locale } from '@/i18n/config';

export default async function LoginPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  if (authToken?.value) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      const res = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        headers: {
          Cookie: `auth_token=${authToken.value}`,
        },
        next: { revalidate: 30 },
      });

      if (res.ok) {
        redirect(`/${locale}`);
      }
    } catch (e) {
      // セッション確認に失敗してもログインページ表示を継続
    }
  }

  // LoginPageClientはクライアントコンポーネントでuseTranslations()を使用
  return <LoginPageClient />;
}
