'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { uploadImage } from '@/lib/storage';
import { Image as ImageIcon, LayoutDashboard, Smartphone, LineChart } from 'lucide-react';

interface FormData {
  type: 'board' | 'transaction' | 'secret';
  title: string;
  body: string;
  eyecatchPath: string; // URLではなくStorage内のパスを保存
  price: string;
  priceUnit: string;
  secretVisibility: 'full' | 'price_only' | 'hidden';

  // Transaction required fields
  appCategories: string[];
  monthlyRevenue: string;
  monthlyRevenueUnit: string;
  monthlyCost: string;
  monthlyCostUnit: string;
  userCountUnit: string;
  appealText: string;
  dashboardUrl: string;
  userUiUrl: string;
  performanceUrl: string;

  // Optional fields
  serviceUrls: string;
  revenueModels: string[];
  techStack: string;
  userCount: string;
  releaseDate: string;
  operationForm: string;
  operationEffort: string;
  transferItems: string[];
  desiredTransferTiming: string;
  growthPotential: string;
  targetCustomers: string;
  marketingChannels: string[];
  mediaMentions: string;
  extraImageUrls: string[];
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
    eyecatchPath: '',
    price: '',
    priceUnit: '1',
    secretVisibility: 'full',
    appCategories: [],
    monthlyRevenue: '',
    monthlyRevenueUnit: '1',
    monthlyCost: '',
    monthlyCostUnit: '1',
    userCountUnit: '1',
    appealText: '',
    dashboardUrl: '',
    userUiUrl: '',
    performanceUrl: '',
    serviceUrls: '',
    revenueModels: [],
    techStack: '',
    userCount: '',
    releaseDate: '',
    operationForm: '',
    operationEffort: '',
    transferItems: [],
    desiredTransferTiming: '',
    growthPotential: '',
    targetCustomers: '',
    marketingChannels: [],
    mediaMentions: '',
    extraImageUrls: []
  });

  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewDashboardImage, setPreviewDashboardImage] = useState<string>('');
  const [selectedDashboardImageFile, setSelectedDashboardImageFile] = useState<File | null>(null);
  const [previewUserUiImage, setPreviewUserUiImage] = useState<string>('');
  const [selectedUserUiImageFile, setSelectedUserUiImageFile] = useState<File | null>(null);
  const [previewPerformanceImage, setPreviewPerformanceImage] = useState<string>('');
  const [selectedPerformanceImageFile, setSelectedPerformanceImageFile] = useState<File | null>(null);
  const [extraImages, setExtraImages] = useState<Array<{ preview: string; file: File }>>([]);
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
    'フード・ドリンク',
    '旅行',
    '写真・動画',
    '音楽',
    'ニュース',
    'スポーツ',
    '天気',
    'ナビゲーション',
    'ファイナンス',
    '医療',
    'ショッピング',
    'ブック',
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
      // Cookie認証（バックエンドが認証をチェック）
      console.log('[PROJECT-CREATE] Submitting project with Cookie authentication');
      console.log('[PROJECT-CREATE] Form data:', {
        title: formData.title,
        appCategories: formData.appCategories,
        appealText: formData.appealText.length,
        monthlyRevenue: formData.monthlyRevenue,
        monthlyCost: formData.monthlyCost,
        price: formData.price
      });

      // 画像をStorageにアップロード
      setUploadingImage(true);
      let eyecatchPath: string | null = null;
      let dashboardPath: string | null = null;
      let userUiPath: string | null = null;
      let performancePath: string | null = null;

      try {
        if (selectedImageFile) {
          console.log('[PROJECT-CREATE] Uploading eyecatch image to storage...');
          eyecatchPath = await uploadImage(selectedImageFile);
          console.log('[PROJECT-CREATE] Eyecatch image uploaded successfully:', eyecatchPath);
        }

        if (selectedDashboardImageFile) {
          console.log('[PROJECT-CREATE] Uploading dashboard image to storage...');
          dashboardPath = await uploadImage(selectedDashboardImageFile);
          console.log('[PROJECT-CREATE] Dashboard image uploaded successfully:', dashboardPath);
        }

        if (selectedUserUiImageFile) {
          console.log('[PROJECT-CREATE] Uploading user UI image to storage...');
          userUiPath = await uploadImage(selectedUserUiImageFile);
          console.log('[PROJECT-CREATE] User UI image uploaded successfully:', userUiPath);
        }

        if (selectedPerformanceImageFile) {
          console.log('[PROJECT-CREATE] Uploading performance image to storage...');
          performancePath = await uploadImage(selectedPerformanceImageFile);
          console.log('[PROJECT-CREATE] Performance image uploaded successfully:', performancePath);
        }
      } catch (error) {
        console.error('[PROJECT-CREATE] Image upload failed:', error);
        alert('画像のアップロードに失敗しました。もう一度お試しください。');
        return;
      } finally {
        setUploadingImage(false);
      }

      // 追加画像をStorageにアップロード
      const extraImagePaths: string[] = [];
      for (const extraImage of extraImages) {
        try {
          console.log('[PROJECT-CREATE] Uploading extra image to storage...');
          const path = await uploadImage(extraImage.file);
          extraImagePaths.push(path);
          console.log('[PROJECT-CREATE] Extra image uploaded successfully:', path);
        } catch (error) {
          console.error('[PROJECT-CREATE] Extra image upload failed:', error);
        }
      }

      const payload: any = {
        type: formData.type,
        title: formData.title,
        body: formData.body || null,
        price: formData.price ? parseInt(formData.price) * parseInt(formData.priceUnit) : null,
      };

      // Add secret_visibility for non-transaction posts
      if (formData.type !== 'transaction') {
        payload.secret_visibility = formData.secretVisibility;
      }

      // Add all image and data fields for transaction posts
      if (formData.type === 'transaction') {
        // Validate required fields for transaction posts
        const missingFields: string[] = [];

        if (!eyecatchPath) missingFields.push('アイキャッチ画像');
        if (!dashboardPath) missingFields.push('管理画面画像');
        if (!userUiPath) missingFields.push('ユーザーUI画像');
        if (!performancePath) missingFields.push('パフォーマンス画像');
        if (!formData.appCategories || formData.appCategories.length === 0) missingFields.push('アプリのカテゴリー');
        if (!formData.monthlyRevenue) missingFields.push('月間売上');
        if (!formData.monthlyCost) missingFields.push('月間コスト');
        if (!formData.appealText || formData.appealText.length < 50) {
          missingFields.push('アピールポイント（50文字以上必須）');
        }

        if (missingFields.length > 0) {
          alert(`以下の必須項目が入力されていません:\n\n${missingFields.join('\n')}`);
          setIsSubmitting(false);
          return;
        }

        // Required fields for transaction
        payload.eyecatch_url = eyecatchPath;
        payload.dashboard_url = dashboardPath;
        payload.user_ui_url = userUiPath;
        payload.performance_url = performancePath;
        payload.app_categories = formData.appCategories;
        payload.monthly_revenue = parseInt(formData.monthlyRevenue) * parseInt(formData.monthlyRevenueUnit);
        payload.monthly_cost = parseInt(formData.monthlyCost) * parseInt(formData.monthlyCostUnit);
        payload.appeal_text = formData.appealText;

        // Optional fields for transaction
        if (formData.serviceUrls) {
          payload.service_urls = formData.serviceUrls.split(',').map(s => s.trim()).filter(s => s);
        }
        if (formData.revenueModels.length > 0) {
          payload.revenue_models = formData.revenueModels;
        }
        if (formData.techStack) {
          payload.tech_stack = formData.techStack.split(',').map(s => s.trim()).filter(s => s);
        }
        if (formData.userCount) {
          payload.user_count = parseInt(formData.userCount) * parseInt(formData.userCountUnit);
        }
        if (formData.releaseDate) {
          payload.release_date = formData.releaseDate;
        }
        if (formData.operationForm) {
          payload.operation_form = formData.operationForm;
        }
        if (formData.operationEffort) {
          payload.operation_effort = formData.operationEffort;
        }
        if (formData.transferItems.length > 0) {
          payload.transfer_items = formData.transferItems;
        }
        if (formData.desiredTransferTiming) {
          payload.desired_transfer_timing = formData.desiredTransferTiming;
        }
        if (formData.growthPotential) {
          payload.growth_potential = formData.growthPotential;
        }
        if (formData.targetCustomers) {
          payload.target_customers = formData.targetCustomers;
        }
        if (formData.marketingChannels.length > 0) {
          payload.marketing_channels = formData.marketingChannels;
        }
        if (formData.mediaMentions) {
          payload.media_mentions = formData.mediaMentions;
        }
        if (extraImagePaths.length > 0) {
          payload.extra_image_urls = extraImagePaths;
        }
      } else {
        // For non-transaction posts, only send eyecatch_url if available
        if (eyecatchPath) {
          payload.eyecatch_url = eyecatchPath;
        }
      }

      console.log('[PROJECT-CREATE] Submitting payload:', payload);

      // Use apiClient which automatically gets token from localStorage
      const result = await apiClient.post('/api/posts', payload);

      console.log('[PROJECT-CREATE] Post created successfully:', result);
      alert('投稿が作成されました!');
      router.push('/');
    } catch (error) {
      console.error('[PROJECT-CREATE] Error during submission:', error);

      // エラーの詳細を取得
      let errorMessage = '不明なエラー';
      let errorDetails = '';

      if (error && typeof error === 'object') {
        const err = error as any;
        errorMessage = err.message || '不明なエラー';

        // バックエンドからのエラー詳細
        if (err.data) {
          console.error('[PROJECT-CREATE] Error data:', err.data);
          errorDetails = JSON.stringify(err.data, null, 2);
        }
      }

      console.error('[PROJECT-CREATE] Error message:', errorMessage);
      console.error('[PROJECT-CREATE] Error details:', errorDetails);

      // 401エラーの場合はログインページにリダイレクト
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        alert('セッションが無効です。再度ログインしてください。');
        router.push('/login');
      } else {
        const displayMessage = errorDetails
          ? `投稿の作成中にエラーが発生しました:\n${errorMessage}\n\n詳細:\n${errorDetails}`
          : `投稿の作成中にエラーが発生しました: ${errorMessage}`;
        alert(displayMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 9;
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

          {/* ステップ2: カテゴリ選択 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクトカテゴリー <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトのカテゴリーを1つ以上選択してください（複数選択可）
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.appCategories.includes(category);
                        const newCategories = isSelected
                          ? formData.appCategories.filter(c => c !== category)
                          : [...formData.appCategories, category];
                        setFormData({ ...formData, appCategories: newCategories });
                        if (currentStep === 2 && newCategories.length > 0) setCurrentStep(3);
                      }}
                      className={`px-3 py-1 text-sm border rounded-full transition ${
                        formData.appCategories.includes(category)
                          ? 'font-semibold'
                          : 'hover:border-gray-400'
                      }`}
                      style={formData.appCategories.includes(category) ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        color: colors.primary
                      } : {
                        borderColor: '#D1D5DB'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ3: 画像アップロード */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクト画像
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの各種スクリーンショットをアップロードしてください（選択時は画像全体が表示されます）
                </p>
                <div className="space-y-2">
                {/* アイキャッチ画像 */}
                <div>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                      previewImage ? 'border-[#323232]' : 'border-gray-300'
                    }`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {previewImage ? (
                      <div className="absolute inset-0">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-10 h-10 mb-3 text-gray-400" strokeWidth={1.5} />
                        <p className="text-sm font-semibold text-gray-400">
                          アイキャッチ画像 <span className="text-red-500">*</span>
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        handleImageUpload(e);
                        if (currentStep === 3) setCurrentStep(4);
                      }}
                      required
                    />
                  </label>
                </div>

                {/* ダッシュボード画像 */}
                <div>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                      previewDashboardImage ? 'border-[#323232]' : 'border-gray-300'
                    }`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {previewDashboardImage ? (
                      <div className="absolute inset-0">
                        <Image
                          src={previewDashboardImage}
                          alt="Dashboard Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <LayoutDashboard className="w-10 h-10 mb-3 text-gray-400" strokeWidth={1.5} />
                        <p className="text-sm font-semibold text-gray-400">
                          ダッシュボード画像 <span className="text-red-500">*</span>
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedDashboardImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewDashboardImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required
                    />
                  </label>
                </div>

                {/* ユーザーUI画像 */}
                <div>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                      previewUserUiImage ? 'border-[#323232]' : 'border-gray-300'
                    }`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {previewUserUiImage ? (
                      <div className="absolute inset-0">
                        <Image
                          src={previewUserUiImage}
                          alt="User UI Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Smartphone className="w-10 h-10 mb-3 text-gray-400" strokeWidth={1.5} />
                        <p className="text-sm font-semibold text-gray-400">
                          ユーザーUI画像 <span className="text-red-500">*</span>
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedUserUiImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewUserUiImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required
                    />
                  </label>
                </div>

                {/* パフォーマンスデータ画像 */}
                <div>
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden relative ${
                      previewPerformanceImage ? 'border-[#323232]' : 'border-gray-300'
                    }`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {previewPerformanceImage ? (
                      <div className="absolute inset-0">
                        <Image
                          src={previewPerformanceImage}
                          alt="Performance Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <LineChart className="w-10 h-10 mb-3 text-gray-400" strokeWidth={1.5} />
                        <p className="text-sm font-semibold text-gray-400">
                          パフォーマンスデータ画像 <span className="text-red-500">*</span>
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedPerformanceImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPreviewPerformanceImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      required
                    />
                  </label>
                </div>

                {/* 追加画像 */}
                {extraImages.length === 0 ? (
                  <div className="flex justify-center mt-4">
                    <label className="cursor-pointer">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setExtraImages([...extraImages, { preview: reader.result as string, file }]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {extraImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#323232]">
                        <Image
                          src={img.preview}
                          alt={`Extra ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setExtraImages(extraImages.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-400 mt-1">追加</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setExtraImages([...extraImages, { preview: reader.result as string, file }]);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ4: アピール文 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  プロダクトのアピール文 <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの機能、特徴、強みなどを詳しく説明してください（50文字以上必須）
                </p>
                <textarea
                  value={formData.appealText}
                  onChange={(e) => {
                    setFormData({ ...formData, appealText: e.target.value });
                    if (currentStep === 4 && e.target.value.length >= 50) setCurrentStep(5);
                  }}
                  placeholder="プロダクトの機能、特徴、ユーザーベース、売却理由などを50文字以上で記載してください..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                  required
                  minLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.appealText.length} / 50文字以上
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ5: 財務情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>5</span>
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
                      月間売上 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.monthlyRevenue}
                        onChange={(e) => {
                          setFormData({ ...formData, monthlyRevenue: e.target.value });
                          if (currentStep === 5 && e.target.value && formData.monthlyCost) setCurrentStep(6);
                        }}
                        placeholder="100"
                        className="w-1/3 md:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.monthlyRevenueUnit}
                          onChange={(e) => setFormData({ ...formData, monthlyRevenueUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: '#323232' } as React.CSSProperties}
                        >
                          <option value="1">円</option>
                          <option value="100">百円</option>
                          <option value="1000">千円</option>
                          <option value="10000">万円</option>
                          <option value="100000000">億円</option>
                          <option value="1000000000000">兆円</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月間コスト <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.monthlyCost}
                        onChange={(e) => {
                          setFormData({ ...formData, monthlyCost: e.target.value });
                          if (currentStep === 5 && e.target.value && formData.monthlyRevenue) setCurrentStep(6);
                        }}
                        placeholder="50"
                        className="w-1/3 md:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.monthlyCostUnit}
                          onChange={(e) => setFormData({ ...formData, monthlyCostUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: '#323232' } as React.CSSProperties}
                        >
                          <option value="1">円</option>
                          <option value="100">百円</option>
                          <option value="1000">千円</option>
                          <option value="10000">万円</option>
                          <option value="100000000">億円</option>
                          <option value="1000000000000">兆円</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ユーザー数（任意）
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.userCount}
                        onChange={(e) => setFormData({ ...formData, userCount: e.target.value })}
                        placeholder="100"
                        className="w-1/3 md:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                      />
                      <div className="relative">
                        <select
                          value={formData.userCountUnit}
                          onChange={(e) => setFormData({ ...formData, userCountUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: '#323232' } as React.CSSProperties}
                        >
                          <option value="1">人</option>
                          <option value="100">百人</option>
                          <option value="1000">千人</option>
                          <option value="10000">万人</option>
                          <option value="100000000">億人</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      リリース日（任意）
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ6: 運営情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>6</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  運営情報
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの運営形態と収益モデルを入力してください
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        運営形態（任意）
                      </label>
                      <div className="relative">
                        <select
                          value={formData.operationForm}
                          onChange={(e) => {
                            setFormData({ ...formData, operationForm: e.target.value });
                            if (currentStep === 6) setCurrentStep(7);
                          }}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                          style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                        >
                          <option value="">選択してください</option>
                          <option value="individual">個人</option>
                          <option value="corporate">法人</option>
                        </select>
                        <svg
                          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        運営工数（任意）
                      </label>
                      <input
                        type="text"
                        value={formData.operationEffort}
                        onChange={(e) => setFormData({ ...formData, operationEffort: e.target.value })}
                        placeholder="例: 週10時間"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      収益モデル（任意・複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['サブスクリプション', '広告', '手数料', '一括購入', 'その他'].map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.revenueModels.includes(model);
                            const newModels = isSelected
                              ? formData.revenueModels.filter(m => m !== model)
                              : [...formData.revenueModels, model];
                            setFormData({ ...formData, revenueModels: newModels });
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.revenueModels.includes(model)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.revenueModels.includes(model) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: '#D1D5DB'
                          }}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ7: 譲渡情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>7</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  譲渡情報
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  譲渡に関する詳細情報を入力してください
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      譲渡物（任意・複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['ソースコード', 'ドメイン', 'SNSアカウント', '顧客データ', 'ブランド', 'その他'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.transferItems.includes(item);
                            const newItems = isSelected
                              ? formData.transferItems.filter(i => i !== item)
                              : [...formData.transferItems, item];
                            setFormData({ ...formData, transferItems: newItems });
                            if (currentStep === 7) setCurrentStep(8);
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.transferItems.includes(item)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.transferItems.includes(item) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: '#D1D5DB'
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      希望譲渡時期（任意）
                    </label>
                    <input
                      type="text"
                      value={formData.desiredTransferTiming}
                      onChange={(e) => setFormData({ ...formData, desiredTransferTiming: e.target.value })}
                      placeholder="例: 3ヶ月以内、できるだけ早く"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      成長可能性（任意）
                    </label>
                    <textarea
                      value={formData.growthPotential}
                      onChange={(e) => setFormData({ ...formData, growthPotential: e.target.value })}
                      placeholder="今後の成長可能性や拡張アイデアを記載してください..."
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

          {/* ステップ8: マーケティング情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>8</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  マーケティング情報
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  ターゲット顧客とマーケティングチャネルを入力してください
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ターゲット顧客層（任意）
                    </label>
                    <input
                      type="text"
                      value={formData.targetCustomers}
                      onChange={(e) => {
                        setFormData({ ...formData, targetCustomers: e.target.value });
                        if (currentStep === 8) setCurrentStep(9);
                      }}
                      placeholder="例: 20-30代のビジネスパーソン"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      マーケティングチャネル（任意・複数選択可）
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['SEO', 'SNS広告', 'コンテンツマーケティング', 'インフルエンサー', 'アフィリエイト', 'その他'].map((channel) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.marketingChannels.includes(channel);
                            const newChannels = isSelected
                              ? formData.marketingChannels.filter(c => c !== channel)
                              : [...formData.marketingChannels, channel];
                            setFormData({ ...formData, marketingChannels: newChannels });
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.marketingChannels.includes(channel)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.marketingChannels.includes(channel) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: '#D1D5DB'
                          }}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メディア掲載実績（任意）
                    </label>
                    <textarea
                      value={formData.mediaMentions}
                      onChange={(e) => setFormData({ ...formData, mediaMentions: e.target.value })}
                      placeholder="メディアでの掲載実績があれば記載してください..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ9: 価格と追加情報 */}
          <div className="bg-white rounded-lg py-8 px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#4B5563', backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: '#4B5563' }}>9</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: '#4B5563' }}>
                  希望売却価格と追加情報
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  プロダクトの売却希望価格と技術情報を入力してください
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      希望売却価格 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="1000"
                        className="w-1/2 md:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.priceUnit}
                          onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: '#323232' } as React.CSSProperties}
                        >
                          <option value="1">円</option>
                          <option value="100">百円</option>
                          <option value="1000">千円</option>
                          <option value="10000">万円</option>
                          <option value="100000000">億円</option>
                          <option value="1000000000000">兆円</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      技術スタック（カンマ区切り、任意）
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
                      サービスURL（カンマ区切り、任意）
                    </label>
                    <input
                      type="text"
                      value={formData.serviceUrls}
                      onChange={(e) => setFormData({ ...formData, serviceUrls: e.target.value })}
                      placeholder="https://example.com, https://app.example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      補足説明（任意）
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
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
                disabled={
                  !formData.title ||
                  formData.appCategories.length === 0 ||
                  !selectedImageFile ||
                  !selectedDashboardImageFile ||
                  !selectedUserUiImageFile ||
                  !selectedPerformanceImageFile ||
                  formData.appealText.length < 50 ||
                  !formData.monthlyRevenue ||
                  !formData.monthlyCost ||
                  !formData.price ||
                  isSubmitting
                }
                className="px-10 py-3 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-between gap-4"
                style={{
                  backgroundColor: (
                    !formData.title ||
                    formData.appCategories.length === 0 ||
                    !selectedImageFile ||
                    !selectedDashboardImageFile ||
                    !selectedUserUiImageFile ||
                    !selectedPerformanceImageFile ||
                    formData.appealText.length < 50 ||
                    !formData.monthlyRevenue ||
                    !formData.monthlyCost ||
                    !formData.price ||
                    isSubmitting
                  ) ? undefined : '#E65D65'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#D14C54';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#E65D65';
                  }
                }}
              >
                {uploadingImage ? '画像をアップロード中...' : isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    投稿中...
                  </>
                ) : (
                  <>
                    プロダクトを投稿
                    <svg className="w-5 h-5 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
