'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';

interface RegisterFormPageProps {
  pageDict?: Record<string, any>;
}

export default function RegisterFormPage({ pageDict = {} }: RegisterFormPageProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!formData.email || !formData.password || !formData.displayName) {
      setError(t('registerFormFillAll'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('registerPasswordMismatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('registerPasswordLength'));
      return;
    }

    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          display_name: formData.displayName,
        }),
        credentials: 'include', // HTTPOnly Cookieを送受信するために必要
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('registerFormFailed'));
      }

      // 登録成功 - セッションがCookieに設定されているので、そのままホームページへ
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerFormFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: '#323232' }}>
          {t('registerFormTitle')}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              {t('displayName')}
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder={t('displayNamePlaceholder')}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              {t('registerFormEmail')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder="example@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              {t('registerFormPassword')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder={t('registerFormPasswordPlaceholder')}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              {t('registerFormConfirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder={t('registerFormConfirmPlaceholder')}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-md font-semibold"
            style={{ backgroundColor: '#E65D65' }}
            disabled={loading}
          >
            {loading ? t('registerFormRegistering') : t('registerFormSignUp')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('registerFormHaveAccount')}{' '}
            <a href={`/${locale}/login`} className="font-semibold hover:underline" style={{ color: '#E65D65' }}>
              {t('header.login')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
