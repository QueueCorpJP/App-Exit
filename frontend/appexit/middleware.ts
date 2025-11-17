import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

/**
 * Next.js Middleware with i18n support
 *
 * 1. next-intl による locale routing
 * 2. Cookie ベースの認証チェック
 */

// next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルを除外（manifest.jsonなど）
  if (pathname.startsWith('/manifest.json') || pathname.match(/\.(json|ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)) {
    return NextResponse.next();
  }

  // next-intl で locale をハンドリング
  const response = intlMiddleware(request);

  // locale を含むパスから locale を除外したパスを取得
  const pathnameWithoutLocale = pathname.replace(/^\/(ja|en)/, '') || '/';

  // 認証トークンを取得
  const authToken = request.cookies.get('auth_token')?.value;

  // 公開ページ（認証不要）
  const publicPaths = [
    '/',              // ホーム画面
    '/login',
    '/register',
    '/reset-password',
    '/about',         // APPEXITについて
    '/help',          // ヘルプ
    '/privacy',       // プライバシーポリシー
    '/terms',         // 利用規約
    '/tokusho',       // 特定商取引法
    '/faq',           // FAQ
    '/contact',       // お問い合わせ
    '/compliance',    // コンプライアンス
    '/cookie-policy', // クッキーポリシー
    '/security',      // セキュリティ
    '/report',        // 通報
    '/customer-harassment', // カスタマーハラスメント
    '/seminar',       // セミナー
    '/support-service', // サポートサービス
    '/projects',      // プロダクト一覧（公開）
  ];

  // 認証が必要なページ（公開ページリストより優先）
  const protectedPaths = [
    '/projects/new',  // プロダクト投稿ページ（認証必須）
  ];

  // 認証が必要なページかチェック
  const isProtectedPath = protectedPaths.some(path => pathnameWithoutLocale.startsWith(path));

  // 公開ページへのアクセスは常に許可
  const isPublicPath = publicPaths.some(path => {
    // ルートパス（/）の場合は完全一致のみ
    if (path === '/') {
      return pathnameWithoutLocale === '/';
    }
    // /projectsの場合は、/projects/newで始まるパスを除外
    if (path === '/projects') {
      return pathnameWithoutLocale.startsWith('/projects') && !pathnameWithoutLocale.startsWith('/projects/new');
    }
    // その他のパスは前方一致
    return pathnameWithoutLocale.startsWith(path);
  });

  if (isPublicPath) {
    return response;
  }

  // 認証が必要なページへのアクセス
  if (!authToken && (isProtectedPath || !isPublicPath)) {
    // 未認証の場合、ログインページにリダイレクト
    const locale = pathname.split('/')[1] || defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済み、アクセス許可
  return response;
}

// Middlewareを適用するパスを設定
export const config = {
  matcher: [
    // i18n routing のために必要
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
