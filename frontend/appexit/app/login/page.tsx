import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginPageClient from '@/components/pages/LoginPageClient';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');

  // Cookieの存在だけではなく、APIでセッション有効性を確認してからリダイレクト
  if (authToken?.value) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    try {
      const res = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        headers: {
          // サーバー側からAPIへCookieを明示転送
          Cookie: `auth_token=${authToken.value}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        redirect('/');
      }
    } catch (e) {
      // セッション確認に失敗してもログインページ表示を継続
    }
  }

  return <LoginPageClient />;
}
