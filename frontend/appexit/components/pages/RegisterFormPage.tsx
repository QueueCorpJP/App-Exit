'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function RegisterFormPage() {
  const router = useRouter();
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
      setError('すべての項目を入力してください');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      // 登録成功
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: '#323232' }}>
          新規登録
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              表示名
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder="山田太郎"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              メールアドレス
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
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder="8文字以上"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: '#323232' }}>
              パスワード（確認）
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65D65] focus:ring-opacity-50"
              placeholder="もう一度入力してください"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-md font-semibold"
            style={{ backgroundColor: '#E65D65' }}
            disabled={loading}
          >
            {loading ? '登録中...' : '登録する'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            すでにアカウントをお持ちですか？{' '}
            <a href="/login" className="font-semibold hover:underline" style={{ color: '#E65D65' }}>
              ログイン
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
