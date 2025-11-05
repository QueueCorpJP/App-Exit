import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 16プロキシ処理
 *
 * 統一戦略: プロキシでの認証チェックは行わない
 * 理由:
 * - EdgeランタイムでLocalStorageにアクセスできない
 * - トークンはSupabase LocalStorageで管理される
 * - 実際の認証はAPIレベル（バックエンドミドルウェア）で行われる
 * - クライアントサイドのルートガードで未認証ユーザーをリダイレクト
 */
export function proxy(request: NextRequest) {
  // すべてのリクエストを通過させる
  // 認証は以下で処理される:
  // 1. バックエンドAPIミドルウェア（主要な防御線）
  // 2. クライアントサイドのルートガード（UX向上）
  return NextResponse.next()
}

// Optionally, specify which paths this proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

