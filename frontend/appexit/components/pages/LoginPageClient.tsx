'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import Button from '@/components/ui/Button';
import { loginWithBackend, loginWithOAuth, LoginMethod } from '@/lib/auth-api';
import { validateEmail, INPUT_LIMITS } from '@/lib/input-validator';

interface LoginPageClientProps {
  error?: string;
}

export default function LoginPageClient({ error: serverError }: LoginPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [error, setError] = useState(serverError);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { refreshSession } = useAuth();

  async function handleOAuthLogin(method: LoginMethod) {
    setError(undefined);
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
      console.log('[LOGIN] Starting OAuth login:', { method, redirectUrl });

      const result = await loginWithOAuth({ method, redirect_url: redirectUrl });
      console.log('[LOGIN] OAuth response:', result);

      if (result.type === 'oauth' && result.provider_url) {
        console.log('[LOGIN] Redirecting to provider:', result.provider_url);
        window.location.href = result.provider_url;
        return;
      }
      throw new Error(t('auth.loginError'));
    } catch (err) {
      console.error('[LOGIN] OAuth login error:', err);
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
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

      console.log('[LOGIN] Backend login successful, cookie set');

      // バックエンドがauth_token Cookieを設定済み
      // 認証コンテキストへ即時反映（AuthProviderの初期化待ちによる遅延を防ぐ）
      await refreshSession();

      // 遷移後にサーバーコンポーネントも最新化
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
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

            <div className="mt-6">
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
                <span className="ml-2">{t('loginWithGoogle')}</span>
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
