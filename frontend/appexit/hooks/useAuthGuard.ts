'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/**
 * ログイン必須ページで使用する認証ガードフック
 * ログインしていない場合、ログインページにリダイレクトします
 *
 * @param redirectPath - リダイレクト先のパス（デフォルト: ログインページ）
 * @returns 認証状態とローディング状態
 */
export function useAuthGuard(redirectPath?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return;

    // ログインしていない場合、ログインページにリダイレクト
    if (!user) {
      // 言語プレフィックスを考慮したリダイレクト先を生成
      const locale = pathname.split('/')[1]; // 例: "ja" or "en"
      const loginPath = redirectPath || `/${locale}/login`;

      // 現在のページをリダイレクト後の戻り先として保存
      const returnUrl = encodeURIComponent(pathname);

      router.push(`${loginPath}?redirect=${returnUrl}`);
    }
  }, [user, loading, router, pathname, redirectPath]);

  return { user, loading, isAuthenticated: !!user };
}
