import dynamic from 'next/dynamic';
import { cookies } from 'next/headers';

const RegisterPageClient = dynamic(() => import('@/components/pages/RegisterPageClient'), {
  ssr: true,
});
import { redirect } from 'next/navigation';
import type { Locale } from '@/i18n/config';

export default async function RegisterPageRoute({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${apiUrl}/api/auth/register/progress`, {
      method: 'GET',
      headers: authToken
        ? { Cookie: `auth_token=${encodeURIComponent(authToken)}` }
        : undefined,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = (await res.json()) as { step: number; redirect_path: string };
      if (data?.redirect_path) {
        redirect(`/${locale}${data.redirect_path}`);
      }
    }
  } catch (e) {
    // 失敗時はクライアント側登録画面をそのまま表示
  }

  // RegisterPageClientはクライアントコンポーネントでuseTranslations()を使用
  return <RegisterPageClient />;
}
