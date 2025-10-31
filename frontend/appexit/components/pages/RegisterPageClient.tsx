'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Button from '@/components/ui/Button';

// フォームデータの型定義
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  privacy: boolean;
}

// 初期状態
const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  terms: false,
  privacy: false,
};

function SubmitButton({ step }: { step: number }) {
  const { pending } = useFormStatus();

  if (step < 2) {
    return null;
  }

  return (
    <Button
      type="submit"
      variant="primary"
      isLoading={pending}
      loadingText="アカウント作成中..."
    >
      アカウント作成
    </Button>
  );
}

interface RegisterPageClientProps {
  error?: string;
}

export default function RegisterPageClient({ error: serverError }: RegisterPageClientProps) {
  const [error, setError] = useState(serverError);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const router = useRouter();

  // 入力値の更新
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // チェックボックスの更新
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // ステップ1のバリデーション
  const validateStep1 = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('すべての項目を入力してください');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }
    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return false;
    }
    return true;
  };

  // ステップ2のバリデーション
  const validateStep2 = (): boolean => {
    if (!formData.terms || !formData.privacy) {
      setError('利用規約とプライバシーポリシーに同意してください');
      return false;
    }
    return true;
  };

  // 次へボタンの処理
  const handleNext = () => {
    setError(undefined);

    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  // 戻るボタンの処理
  const handleBack = () => {
    setError(undefined);
    if (step > 1) {
      setStep(step - 1);
    }
  };


  // フォーム送信の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!validateStep2()) {
      return;
    }

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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'アカウント作成に失敗しました');
        return;
      }

      // トークンの取得
      const accessToken = result.data?.access_token || result.data?.token;
      const refreshToken = result.data?.refresh_token;

      if (!accessToken || !refreshToken) {
        setError('認証情報の取得に失敗しました');
        return;
      }

      // Supabaseセッション設定
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // ホームへリダイレクト
      window.location.href = '/';
    } catch (error) {
      console.error('Register error:', error);
      setError('アカウント作成中にエラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          新規アカウント作成
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{' '}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/login')}
            className="p-0 h-auto font-medium"
          >
            ログイン
          </Button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* ステップインジケーター */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step >= stepNumber
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 2 && (
                    <div
                      className={`w-32 h-1 mx-2 ${
                        step > stepNumber ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 max-w-xs mx-auto">
              <span>アカウント情報</span>
              <span>利用規約</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: アカウント情報 */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント情報</h3>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    placeholder="your@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    placeholder="8文字以上のパスワード"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    パスワード（確認）
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                    placeholder="パスワードを再入力"
                  />
                </div>
              </div>
            )}

            {/* Step 2: 利用規約 */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">利用規約への同意</h3>

                <div className="flex items-start">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    checked={formData.terms}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                    <span className="font-medium">利用規約</span>に同意します（必須）
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('/terms', '_blank')}
                      className="p-0 h-auto ml-1 underline"
                    >
                      内容を確認する
                    </Button>
                  </label>
                </div>

                <div className="flex items-start">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    required
                    checked={formData.privacy}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="privacy" className="ml-2 block text-sm text-gray-900">
                    <span className="font-medium">プライバシーポリシー</span>に同意します（必須）
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('/privacy', '_blank')}
                      className="p-0 h-auto ml-1 underline"
                    >
                      内容を確認する
                    </Button>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className={`mt-4 rounded-md p-4 ${
                error.includes('正常に作成') || error.includes('成功') ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`text-sm ${
                  error.includes('正常に作成') || error.includes('成功') ? 'text-green-700' : 'text-red-700'
                }`}>
                  {error}
                </div>
                
                {/* 既存ユーザーエラーの場合のログインリンク */}
                {error.includes('既に登録されています') && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/login')}
                    >
                      ログインページへ
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  戻る
                </Button>
              )}

              <div className="flex-1 flex justify-end">
                {step < 2 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleNext}
                  >
                    次へ
                  </Button>
                ) : (
                  <SubmitButton step={step} />
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}