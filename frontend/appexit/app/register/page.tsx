import RegisterPageClient from '@/components/pages/RegisterPageClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RegisterPageRoute() {
  // サーバーでCookieを読み取り、バックエンドの進捗APIへ転送
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const res = await fetch(`${apiUrl}/api/auth/register/progress`, {
      method: 'GET',
      headers: authToken
        ? { Cookie: `auth_token=${encodeURIComponent(authToken)}` }
        : undefined,
      // 登録進捗は都度最新で評価
      cache: 'no-store',
    });

    if (res.ok) {
      const data = (await res.json()) as { step: number; redirect_path: string };
      if (data?.redirect_path) {
        redirect(data.redirect_path);
      }
    }
  } catch (e) {
    // 失敗時はクライアント側登録画面をそのまま表示
  }

  // 未認証 or 進捗判定不可は従来の登録画面（既存デザイン維持）
  return <RegisterPageClient />;
}
