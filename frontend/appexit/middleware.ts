import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware
 *
 * Cookie ベースの認証チェック
 * - auth_token Cookieの存在をチェック
 * - 認証が必要なページへのアクセスを制御
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 認証トークンを取得
  const authToken = request.cookies.get('auth_token')?.value

  // 公開ページ（認証不要）
  const publicPaths = [
    '/login',
    '/register',
    '/reset-password',
    '/_next',
    '/api',
    '/favicon.ico',
    '/icon.png',
  ]

  // 公開ページへのアクセスは常に許可
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    // ログイン済みユーザーがログイン/登録ページにアクセスした場合、ホームにリダイレクト
    if (authToken && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // 認証が必要なページへのアクセス
  if (!authToken) {
    // 未認証の場合、ログインページにリダイレクト
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 認証済み、アクセス許可
  return NextResponse.next()
}

// Middlewareを適用するパスを設定
export const config = {
  matcher: [
    /*
     * すべてのパスにマッチ（静的ファイルと一部のパスを除く）
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
