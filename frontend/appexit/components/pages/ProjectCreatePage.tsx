'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { uploadImage } from '@/lib/storage';

interface FormData {
  type: 'board' | 'transaction' | 'secret';
  title: string;
  body: string;
  coverImagePath: string; // URLではなくStorage内のパスを保存
  price: string;

  // Post details (transaction/secret only)
  appName: string;
  appCategory: string;
  monthlyRevenue: string;
  monthlyProfit: string;
  mau: string;
  dau: string;
  storeUrl: string;
  techStack: string;
  notes: string;
}

export default function ProjectCreatePage() {
  const router = useRouter();

  // カラーテーマ定義
  const colors = {
    primary: '#5588bb',
    primaryHover: '#4477aa',
    primaryLight: '#e8f0f7',
    dark: '#323232'
  };

  const [formData, setFormData] = useState<FormData>({
    type: 'transaction',
    title: '',
    body: '',
    coverImagePath: '',
    price: '',
    appName: '',
    appCategory: '',
    monthlyRevenue: '',
    monthlyProfit: '',
    mau: '',
    dau: '',
    storeUrl: '',
    techStack: '',
    notes: ''
  });

  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categories = [
    'ソーシャル',
    'EC・マーケットプレイス',
    'ゲーム',
    'ユーティリティ',
    '生産性',
    'エンターテイメント',
    'ヘルスケア',
    '教育',
    'ビジネス',
    'ライフスタイル',
    'その他'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルを保存してプレビューを表示
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if user has Supabase session (as a backup check)
      // The main authentication is handled by the backend via HttpOnly cookies
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      console.log('[PROJECT-CREATE] Supabase session:', session ? 'exists' : 'missing');

      if (!session) {
        alert('ログインセッションが見つかりません。再度ログインしてください。');
        router.push('/login');
        return;
      }

      // 画像をStorageにアップロード
      let coverImagePath: string | null = null;
      if (selectedImageFile) {
        try {
          setUploadingImage(true);
          console.log('[PROJECT-CREATE] Uploading image to storage...');
          coverImagePath = await uploadImage(selectedImageFile, session.user.id);
          console.log('[PROJECT-CREATE] Image uploaded successfully:', coverImagePath);
        } catch (error) {
          console.error('[PROJECT-CREATE] Image upload failed:', error);
          alert('画像のアップロードに失敗しました。もう一度お試しください。');
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const payload: any = {
        type: formData.type,
        title: formData.title,
        body: formData.body || null,
        cover_image_url: coverImagePath, // Storage内のパスを保存
        price: formData.price ? parseInt(formData.price) : null,
      };

      // Add details for transaction/secret posts
      if (formData.type === 'transaction' || formData.type === 'secret') {
        payload.app_name = formData.appName || null;
        payload.app_category = formData.appCategory || null;
        payload.monthly_revenue = formData.monthlyRevenue ? parseInt(formData.monthlyRevenue) : null;
        payload.monthly_profit = formData.monthlyProfit ? parseInt(formData.monthlyProfit) : null;
        payload.mau = formData.mau ? parseInt(formData.mau) : null;
        payload.dau = formData.dau ? parseInt(formData.dau) : null;
        payload.store_url = formData.storeUrl || null;
        payload.tech_stack = formData.techStack || null;
        payload.notes = formData.notes || null;
      }

      console.log('[PROJECT-CREATE] Submitting payload:', payload);

      // Use apiClient which automatically gets token from localStorage
      const result = await apiClient.post('/api/posts', payload);

      alert('投稿が作成されました!');
      router.push('/apps');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';

      // 401エラーの場合はログインページにリダイレクト
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        alert('セッションが無効です。再度ログインしてください。');
        router.push('/login');
      } else {
        alert(`投稿の作成中にエラーが発生しました: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 7;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="py-8">
        {/* プログレスバー - 幅制限あり */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="text-xl font-extrabold text-center mb-4" style={{ color: '#323232' }}>プロダクト投稿を作成</h1>
          <div className="flex justify-end items-center mb-6">
            <span className="text-sm font-medium" style={{ color: '#323232' }}>
              ステップ {currentStep} / {totalSteps}
            </span>
          </div>
          <div className="relative">
            <div className="flex justify-between items-center">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                <div key={step} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                  {step < totalSteps && (
                    <div
                      className="absolute top-5 left-1/2 h-0.5 transition-all duration-300"
                      style={{
                        width: 'calc(100% - 40px)',
                        backgroundColor: step < currentStep ? '#323232' : '#E5E7EB',
                        left: 'calc(50% + 20px)'
                      }}
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10"
                    style={{
                      backgroundColor: step <= currentStep ? '#323232' : '#fff',
                      color: step <= currentStep ? '#fff' : '#9CA3AF',
                      border: step <= currentStep ? 'none' : '2px solid #E5E7EB'
                    }}
                  >
                    {step < currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フォーム - プログレスバーと同じ幅 */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-2">
          {/* ステップ1: プロダクト名 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  投稿タイトル
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの名前や簡潔なタイトルを入力してください
                </p>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (currentStep === 1 && e.target.value) setCurrentStep(2);
                  }}
                  placeholder="例: タスク管理プロダクト「TaskMaster」"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                  required
                />
              </div>
            </div>
            </div>
          </div>

          {/* ステップ2: プロダクト名 (詳細) */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクト名
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの正式名称を入力してください
                </p>
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => {
                    setFormData({ ...formData, appName: e.target.value });
                    if (currentStep === 2 && e.target.value) setCurrentStep(3);
                  }}
                  placeholder="例: TaskMaster Pro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                  required
                />
              </div>
            </div>
            </div>
          </div>

          {/* ステップ3: カテゴリ選択 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクトカテゴリー
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの主要カテゴリーを選択してください
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, appCategory: category });
                        if (currentStep === 3) setCurrentStep(4);
                      }}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.appCategory === category
                          ? 'font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={formData.appCategory === category ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        color: colors.primary
                      } : {}}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ4: カバー画像 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  カバー画像
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトのスクリーンショットやアイコンをアップロードしてください
                </p>

                {previewImage && (
                  <div className="mb-4 relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={previewImage}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <label
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">クリックしてアップロード</span>
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageUpload(e);
                      if (currentStep === 4) setCurrentStep(5);
                    }}
                  />
                </label>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ5: 詳細説明 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>5</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクトの説明
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの機能、特徴、強みなどを詳しく説明してください
                </p>
                <textarea
                  value={formData.body}
                  onChange={(e) => {
                    setFormData({ ...formData, body: e.target.value });
                    if (currentStep === 5 && e.target.value) setCurrentStep(6);
                  }}
                  placeholder="プロダクトの機能、特徴、ユーザーベース、売却理由などを記載してください..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                  required
                />
              </div>
            </div>
            </div>
          </div>

          {/* ステップ6: 財務情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>6</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  財務情報・ユーザー数
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの財務情報とユーザー数を入力してください
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月間売上
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyRevenue}
                      onChange={(e) => {
                        setFormData({ ...formData, monthlyRevenue: e.target.value });
                        if (currentStep === 6 && e.target.value) setCurrentStep(7);
                      }}
                      placeholder="1000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月間利益
                    </label>
                    <input
                      type="number"
                      value={formData.monthlyProfit}
                      onChange={(e) => setFormData({ ...formData, monthlyProfit: e.target.value })}
                      placeholder="500000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月間アクティブユーザー (MAU)
                    </label>
                    <input
                      type="number"
                      value={formData.mau}
                      onChange={(e) => setFormData({ ...formData, mau: e.target.value })}
                      placeholder="10000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      日次アクティブユーザー (DAU)
                    </label>
                    <input
                      type="number"
                      value={formData.dau}
                      onChange={(e) => setFormData({ ...formData, dau: e.target.value })}
                      placeholder="3000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ7: 価格と技術情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>7</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  希望売却価格と技術情報
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの売却希望価格と技術スタックを入力してください
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      希望売却価格
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="10000000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      技術スタック
                    </label>
                    <input
                      type="text"
                      value={formData.techStack}
                      onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                      placeholder="React, Node.js, PostgreSQL"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ストアURL
                    </label>
                    <input
                      type="url"
                      value={formData.storeUrl}
                      onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                      placeholder="https://apps.apple.com/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備考
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="その他の補足情報があれば記載してください..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

            {/* 送信ボタン */}
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4 justify-end pt-6">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold transition-colors"
                disabled={isSubmitting}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!formData.title || !formData.appName || !formData.body || !formData.price || isSubmitting}
                className="px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: (!formData.title || !formData.appName || !formData.body || !formData.price || isSubmitting) ? undefined : colors.primary
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = colors.primary;
                  }
                }}
              >
                {uploadingImage ? '画像をアップロード中...' : isSubmitting ? '投稿中...' : 'プロダクトを投稿'}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
