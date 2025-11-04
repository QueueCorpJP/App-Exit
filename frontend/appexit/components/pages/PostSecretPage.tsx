'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { uploadImage } from '@/lib/storage';

export default function PostSecretPage() {
  const router = useRouter();
  const { user, token, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // カラーテーマ定義（transactionページと同じ）
  const colors = {
    primary: '#5588bb',
    primaryHover: '#4477aa',
    primaryLight: '#e8f0f7',
    dark: '#323232'
  };

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    price: '',
    secretVisibility: 'price_only' as 'price_only' | 'partial' | 'full',
    // Post details
    appName: '',
    appCategory: '',
    monthlyRevenue: '',
    monthlyProfit: '',
    mau: '',
    dau: '',
    storeUrl: '',
    techStack: '',
    notes: '',
  });

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      setError('ログインが必要です');
      return;
    }

    if (!profile) {
      setError('プロフィール情報が取得できません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 画像をStorageにアップロード
      let coverImagePath: string | null = null;
      if (selectedImageFile) {
        coverImagePath = await uploadImage(selectedImageFile, user.id);
      }

      // 投稿データを作成
      const payload = {
        type: 'secret',
        title: formData.title,
        body: formData.body,
        cover_image_url: coverImagePath,
        price: formData.price ? parseInt(formData.price) : null,
        secret_visibility: formData.secretVisibility,
        is_active: true,
        details: {
          app_name: formData.appName,
          app_category: formData.appCategory,
          monthly_revenue: formData.monthlyRevenue ? parseInt(formData.monthlyRevenue) : null,
          monthly_profit: formData.monthlyProfit ? parseInt(formData.monthlyProfit) : null,
          mau: formData.mau ? parseInt(formData.mau) : null,
          dau: formData.dau ? parseInt(formData.dau) : null,
          store_url: formData.storeUrl || null,
          tech_stack: formData.techStack || null,
          notes: formData.notes || null,
        }
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '投稿に失敗しました');
      }

      const result = await response.json();
      router.push(`/projects/${result.id}`);
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg p-12">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">シークレット投稿</h1>
                <p className="text-gray-600">NDA締結企業のみに公開されるプロダクト出品</p>
              </div>
              <span className="text-sm font-medium" style={{ color: '#323232' }}>
                ステップ {currentStep} / 2
              </span>
            </div>
            <div className="relative">
              <div className="flex justify-between items-center">
                {[1, 2].map((step) => (
                  <div key={step} className="flex flex-col items-center relative" style={{ flex: 1 }}>
                    {step < 2 && (
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
                    <span className="text-xs mt-2 font-medium" style={{ color: step <= currentStep ? '#323232' : '#9CA3AF' }}>
                      {step === 1 ? '基本情報' : '詳細情報'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleNextStep}>
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* タイトル */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="例: 月間売上500万円のSNSプロダクト"
                  />
                </div>

                {/* 本文 */}
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                    概要説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="body"
                    required
                    rows={6}
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="プロダクトの概要、特徴、売却理由などを記載してください"
                  />
                </div>

                {/* 画像アップロード */}
                <div>
                  <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-2">
                    カバー画像 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    id="coverImage"
                    required
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                  />
                  {imagePreview && (
                    <div className="mt-4">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-64 object-cover rounded-md" />
                    </div>
                  )}
                </div>

                {/* 価格 */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    希望価格 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="price"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="10000000"
                    />
                    <span className="absolute right-4 top-2 text-gray-500">円</span>
                  </div>
                </div>

                {/* 公開範囲設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    情報公開範囲 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="radio"
                        value="price_only"
                        checked={formData.secretVisibility === 'price_only'}
                        onChange={(e) => setFormData({ ...formData, secretVisibility: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">価格のみ公開</div>
                        <div className="text-xs text-gray-500">NDAなしでも価格のみ表示。詳細情報はNDA締結後に公開</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="radio"
                        value="partial"
                        checked={formData.secretVisibility === 'partial'}
                        onChange={(e) => setFormData({ ...formData, secretVisibility: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">一部公開</div>
                        <div className="text-xs text-gray-500">基本情報は公開、詳細情報はNDA締結後に公開</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="radio"
                        value="full"
                        checked={formData.secretVisibility === 'full'}
                        onChange={(e) => setFormData({ ...formData, secretVisibility: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">NDA締結後のみ全公開</div>
                        <div className="text-xs text-gray-500">すべての情報がNDA締結企業のみに表示</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold transition-colors"
                    disabled={loading}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 text-white rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: colors.primary }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                  >
                    次へ
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* プロダクト名 */}
                  <div>
                    <label htmlFor="appName" className="block text-sm font-medium text-gray-700 mb-2">
                      プロダクト名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="appName"
                      required
                      value={formData.appName}
                      onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="MyApp"
                    />
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <label htmlFor="appCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="appCategory"
                      required
                      value={formData.appCategory}
                      onChange={(e) => setFormData({ ...formData, appCategory: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">選択してください</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 月間売上 */}
                  <div>
                    <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-gray-700 mb-2">
                      月間売上
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="monthlyRevenue"
                        value={formData.monthlyRevenue}
                        onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="5000000"
                      />
                      <span className="absolute right-4 top-2 text-gray-500">円</span>
                    </div>
                  </div>

                  {/* 月間利益 */}
                  <div>
                    <label htmlFor="monthlyProfit" className="block text-sm font-medium text-gray-700 mb-2">
                      月間利益
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="monthlyProfit"
                        value={formData.monthlyProfit}
                        onChange={(e) => setFormData({ ...formData, monthlyProfit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="3000000"
                      />
                      <span className="absolute right-4 top-2 text-gray-500">円</span>
                    </div>
                  </div>

                  {/* MAU */}
                  <div>
                    <label htmlFor="mau" className="block text-sm font-medium text-gray-700 mb-2">
                      月間アクティブユーザー (MAU)
                    </label>
                    <input
                      type="number"
                      id="mau"
                      value={formData.mau}
                      onChange={(e) => setFormData({ ...formData, mau: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="10000"
                    />
                  </div>

                  {/* DAU */}
                  <div>
                    <label htmlFor="dau" className="block text-sm font-medium text-gray-700 mb-2">
                      日間アクティブユーザー (DAU)
                    </label>
                    <input
                      type="number"
                      id="dau"
                      value={formData.dau}
                      onChange={(e) => setFormData({ ...formData, dau: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="3000"
                    />
                  </div>
                </div>

                {/* ストアURL */}
                <div>
                  <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    ストアURL
                  </label>
                  <input
                    type="url"
                    id="storeUrl"
                    value={formData.storeUrl}
                    onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="https://apps.apple.com/..."
                  />
                </div>

                {/* 技術スタック */}
                <div>
                  <label htmlFor="techStack" className="block text-sm font-medium text-gray-700 mb-2">
                    技術スタック
                  </label>
                  <input
                    type="text"
                    id="techStack"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="React Native, Firebase, Node.js"
                  />
                </div>

                {/* 備考 */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    備考・補足情報
                  </label>
                  <textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="その他特記事項があれば記載してください"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold transition-colors"
                    disabled={loading}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    戻る
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: loading ? undefined : colors.primary
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
                    {loading ? '投稿中...' : '投稿する'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
