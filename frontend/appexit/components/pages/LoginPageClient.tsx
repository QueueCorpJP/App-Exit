'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/ui/Button';
import { loginWithBackend, loginWithOAuth, LoginMethod, getApiUrl } from '@/lib/auth-api';
import { validateEmail, INPUT_LIMITS } from '@/lib/input-validator';

interface LoginPageClientProps {
  error?: string;
}

export default function LoginPageClient({ error: serverError }: LoginPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [error, setError] = useState(serverError);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { refreshSession } = useAuth();

  // リダイレクト先のURLを取得
  const [redirectUrl, setRedirectUrl] = useState<string>('/');

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
  }, [searchParams]);

  // OAuthコールバック処理
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;

      console.log('[OAuth Callback] Checking URL hash:', hash);

      if (hash && hash.includes('access_token')) {
        setIsLoading(true);
        console.log('[OAuth Callback] Access token found in URL fragment');
        try {
          // URLフラグメントからトークン情報を抽出
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const errorParam = params.get('error');
          const errorDescription = params.get('error_description');

          // エラーチェック
          if (errorParam) {
            console.error('[OAuth Callback] Error from provider:', errorParam, errorDescription);
            throw new Error(errorDescription || errorParam);
          }

          if (accessToken) {
            console.log('[OAuth Callback] Access token length:', accessToken.length);

            // 統一されたAPI URL取得関数を使用
            const apiUrl = getApiUrl();

            console.log('[OAuth Callback] Sending tokens to backend:', apiUrl);

            // バックエンドにトークンを送信してCookie認証を確立
            const sessionResponse = await fetch(`${apiUrl}/api/auth/oauth/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
              }),
              credentials: 'include',
              cache: 'no-store',
            });

            console.log('[OAuth Callback] Backend response status:', sessionResponse.status);

            if (!sessionResponse.ok) {
              const errorData = await sessionResponse.json().catch(() => ({ error: 'OAuth認証に失敗しました' }));
              console.error('[OAuth Callback] Backend error:', errorData);
              throw new Error(errorData.error || 'OAuth認証に失敗しました');
            }

            console.log('[OAuth Callback] Session established successfully');

            // 認証コンテキストを更新
            await refreshSession();

            // URLフラグメントをクリア
            window.history.replaceState(null, '', window.location.pathname + window.location.search);

            console.log('[OAuth Callback] Redirecting to:', redirectUrl);

            // リダイレクト先へ遷移
            router.push(redirectUrl);
            router.refresh();
          }
        } catch (err) {
          console.error('[OAuth Callback] Error:', err);
          setError(err instanceof Error ? err.message : 'OAuth認証に失敗しました');
          setIsLoading(false);
          // URLフラグメントをクリア（エラー時も）
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } else if (hash && hash.includes('error')) {
        // エラーがURLフラグメントに含まれている場合
        const params = new URLSearchParams(hash.substring(1));
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');
        console.error('[OAuth Callback] OAuth error in URL:', errorParam, errorDescription);
        setError(errorDescription || errorParam || 'OAuth認証に失敗しました');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    handleOAuthCallback();
  }, [router, redirectUrl, refreshSession]);

  async function handleOAuthLogin(method: LoginMethod) {
    setError(undefined);
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;

      console.log(`[OAuth Login] Starting ${method} login with redirect: ${redirectUrl}`);

      const result = await loginWithOAuth({ method, redirect_url: redirectUrl });

      console.log('[OAuth Login] Received response:', result);

      if (result.type === 'oauth' && result.provider_url) {
        console.log(`[OAuth Login] Redirecting to provider URL: ${result.provider_url}`);
        window.location.href = result.provider_url;
        return;
      }
      console.error('[OAuth Login] Invalid response:', result);
      throw new Error(t('auth.loginError'));
    } catch (err) {
      console.error('[OAuth Login] Error:', err);
      const errorMessage = err instanceof Error ? err.message : t('auth.loginError');
      setError(errorMessage);
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 🔒 SECURITY: メールアドレスをバリデート
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(t('invalidEmail') || 'Invalid email address');
      setIsLoading(false);
      return;
    }

    // パスワード長チェック
    if (password.length > INPUT_LIMITS.PASSWORD) {
      setError(t('passwordTooLong') || 'Password is too long');
      setIsLoading(false);
      return;
    }

    try {
      // バックエンドAPIでログイン（バックエンドがHTTPOnly Cookieを設定）
      await loginWithBackend({ email: emailValidation.sanitized, password });

      // バックエンドがauth_token Cookieを設定済み
      // 認証コンテキストへ即時反映（AuthProviderの初期化待ちによる遅延を防ぐ）
      await refreshSession();

      // 遷移後にサーバーコンポーネントも最新化
      // リダイレクト先がある場合はそこへ、なければホームへ
      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
      setIsLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .login-title-custom {
          color: #323232 !important;
          font-weight: 900 !important;
          font-size: 1.125rem !important;
          text-align: center !important;
          margin-bottom: 1.5rem !important;
          -webkit-text-stroke: 0.3px #323232 !important;
          text-stroke: 0.3px #323232 !important;
          letter-spacing: 0.02em !important;
        }
      `}} />
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <img src="/icon.png" alt="AppExit" className="h-12 w-auto" />
          </div>
          <h2 className="login-title-custom">{t('auth.loginTitle')}</h2>

        <div className="bg-white py-8 px-4 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={INPUT_LIMITS.EMAIL}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900"
                  style={{
                    '--tw-ring-color': '#4285FF'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4285FF'
                    e.currentTarget.style.outline = '2px solid #4285FF'
                    e.currentTarget.style.outlineOffset = '0px'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.outline = 'none'
                  }}
                  placeholder={t('auth.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={INPUT_LIMITS.PASSWORD}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none sm:text-sm text-gray-900"
                  style={{
                    '--tw-ring-color': '#4285FF'
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4285FF'
                    e.currentTarget.style.outline = '2px solid #4285FF'
                    e.currentTarget.style.outlineOffset = '0px'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB'
                    e.currentTarget.style.outline = 'none'
                  }}
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{
                    accentColor: '#4285FF'
                  }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium" style={{ color: '#4285FF' }} onMouseEnter={(e) => e.currentTarget.style.color = '#3367D6'} onMouseLeave={(e) => e.currentTarget.style.color = '#4285FF'}>
                  {t('auth.forgotPassword')}
                </a>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              loadingText={`${t('auth.loginButton')}...`}
              style={{
                backgroundColor: isHovered ? '#D14C54' : '#E65D65',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {t('auth.loginButton')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('loginOr')}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('google')}
                isLoading={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">{t('auth.loginWithGoogle')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('github')}
                isLoading={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="ml-2">{t('auth.loginWithGithub')}</span>
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.noAccount')}{' '}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/register`)}
            className="p-0 h-auto font-medium"
          >
            {t('header.register')}
          </Button>
        </p>
      </div>
    </div>
    </>
  );
}
