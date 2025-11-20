'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { uploadImage } from '@/lib/storage';
import { Image as ImageIcon, LayoutDashboard, Smartphone, LineChart } from 'lucide-react';
import { sanitizeText, validateURL, INPUT_LIMITS } from '@/lib/input-validator';
import { useAuthGuard } from '@/hooks/useAuthGuard';

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

interface ProjectCreatePageProps {
  postType: 'board' | 'transaction' | 'secret';
  pageTitle: string;
  pageSubtitle?: string;
  pageDict?: Record<string, any>; // ページ固有翻訳（遅延ロード）
}

export default function ProjectCreatePage({ postType, pageTitle, pageSubtitle, pageDict = {} }: ProjectCreatePageProps) {
  const router = useRouter();
  const { loading: authGuardLoading } = useAuthGuard();
  const t = useTranslations();
  const tCategories = useTranslations('categories');
  const tCommon = useTranslations('common');

  // ページ専用翻訳を取得（遅延ロード）
  const tForm = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = pageDict.form;
    for (const k of keys) {
      value = value?.[k];
    }
    let result = value || key;

    // パラメータの置換
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return result;
  };

  // カラーテーマ定義 - secretページは色を反転
  const colors = postType === 'secret' ? {
    primary: '#323232',
    primaryHover: '#1a1a1a',
    primaryLight: '#f5f5f5',
    dark: '#5588bb',
    background: '#323232',
    text: '#ffffff'
  } : {
    primary: '#5588bb',
    primaryHover: '#4477aa',
    primaryLight: '#e8f0f7',
    dark: '#323232',
    background: '#F9F8F7',
    text: '#323232'
  };

  const [formData, setFormData] = useState<FormData>({
    type: postType,
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
    { key: 'social', label: tCategories('social') },
    { key: 'ecommerce', label: tCategories('ecommerce') },
    { key: 'game', label: tCategories('game') },
    { key: 'education', label: tCategories('education') },
    { key: 'health', label: tCategories('health') },
    { key: 'finance', label: tCategories('finance') },
    { key: 'productivity', label: tCategories('productivity') },
    { key: 'entertainment', label: tCategories('entertainment') },
    { key: 'news', label: tCategories('news') },
    { key: 'travel', label: tCategories('travel') },
    { key: 'food', label: tCategories('food') },
    { key: 'lifestyle', label: tCategories('lifestyle') },
    { key: 'sports', label: tCategories('sports') },
    { key: 'music', label: tCategories('music') },
    { key: 'photo', label: tCategories('photo') },
    { key: 'communication', label: tCategories('communication') },
    { key: 'utilities', label: tCategories('utilities') },
    { key: 'weather', label: tCategories('weather') },
    { key: 'navigation', label: tCategories('navigation') },
    { key: 'medical', label: tCategories('medical') },
    { key: 'matching', label: tCategories('matching') },
    { key: 'ai', label: tCategories('ai') },
    { key: 'other', label: tCategories('other') }
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
      // 🔒 SECURITY: タイトルをサニタイズ
      const titleSanitized = sanitizeText(formData.title, INPUT_LIMITS.TITLE, {
        allowHTML: false,
        strictMode: true,
      });

      if (!titleSanitized.isValid) {
        alert(tForm('invalidContent') || 'Invalid content detected in title');
        setIsSubmitting(false);
        return;
      }

      // 🔒 SECURITY: 本文をサニタイズ
      const bodySanitized = sanitizeText(formData.body, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });

      if (!bodySanitized.isValid) {
        alert(tForm('invalidContent') || 'Invalid content detected in body');
        setIsSubmitting(false);
        return;
      }

      // 🔒 SECURITY: アピールテキストをサニタイズ
      const appealTextSanitized = sanitizeText(formData.appealText, INPUT_LIMITS.DESCRIPTION, {
        allowHTML: false,
        strictMode: false,
      });

      if (!appealTextSanitized.isValid) {
        alert(tForm('invalidContent') || 'Invalid content detected in appeal text');
        setIsSubmitting(false);
        return;
      }

      // Cookie認証（バックエンドが認証をチェック）
      // 画像をStorageにアップロード
      setUploadingImage(true);
      let eyecatchPath: string | null = null;
      let dashboardPath: string | null = null;
      let userUiPath: string | null = null;
      let performancePath: string | null = null;

      try {
        if (selectedImageFile) {
          eyecatchPath = await uploadImage(selectedImageFile);
        }

        if (selectedDashboardImageFile) {
          dashboardPath = await uploadImage(selectedDashboardImageFile);
        }

        if (selectedUserUiImageFile) {
          userUiPath = await uploadImage(selectedUserUiImageFile);
        }

        if (selectedPerformanceImageFile) {
          performancePath = await uploadImage(selectedPerformanceImageFile);
        }
      } catch (error) {
        alert(tForm('imageUploadFailed'));
        return;
      } finally {
        setUploadingImage(false);
      }

      // 追加画像をStorageにアップロード
      const extraImagePaths: string[] = [];
      for (const extraImage of extraImages) {
        try {
          const path = await uploadImage(extraImage.file);
          extraImagePaths.push(path);
        } catch (error) {
          // Extra image upload failed - skip this image
        }
      }

      const payload: any = {
        type: formData.type,
        title: titleSanitized.sanitized,
        body: bodySanitized.sanitized || null,
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

        if (!eyecatchPath) missingFields.push(tForm('eyecatchImage'));
        if (!dashboardPath) missingFields.push(tForm('dashboardImage'));
        if (!userUiPath) missingFields.push(tForm('userUiImage'));
        if (!performancePath) missingFields.push(tForm('performanceImage'));
        if (!formData.appCategories || formData.appCategories.length === 0) missingFields.push(tForm('productCategoryRequired'));
        if (!formData.monthlyRevenue) missingFields.push(tForm('monthlyRevenue'));
        if (!formData.monthlyCost) missingFields.push(tForm('monthlyCost'));
        if (!formData.appealText || formData.appealText.length < 50) {
          missingFields.push(tForm('appealTextRequired') + ' (50+)');
        }

        if (missingFields.length > 0) {
          alert(tForm('missingRequiredFields', { fields: missingFields.join('\n') }));
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
        payload.appeal_text = appealTextSanitized.sanitized;

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

      // apiClientはCookieベースの認証を使用（HttpOnly Cookieが自動送信される）
      await apiClient.post('/api/posts', payload);

      alert(tForm('postCreated'));
      router.push('/');
    } catch (error) {
      // エラーの詳細を取得
      let errorMessage = tForm('errorUnknown');
      let errorDetails = '';

      if (error && typeof error === 'object') {
        const err = error as any;
        errorMessage = err.message || tForm('errorUnknown');

        // バックエンドからのエラー詳細
        if (err.data) {
          errorDetails = JSON.stringify(err.data, null, 2);
        }
      }

      // 401エラーの場合はログインページにリダイレクト
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        alert(tForm('sessionInvalid'));
        router.push('/login');
      } else {
        const displayMessage = errorDetails
          ? tForm('errorDetail', { message: errorMessage, details: errorDetails })
          : tForm('errorSimple', { message: errorMessage });
        alert(displayMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 9;
  const progress = (currentStep / totalSteps) * 100;

  // 共通スタイル定義
  const cardBgColor = postType === 'secret' ? 'transparent' : 'white';
  const labelColor = postType === 'secret' ? '#ffffff' : '#4B5563';
  const textColor = postType === 'secret' ? '#d4d4d4' : '#6b7280';
  const inputBgColor = postType === 'secret' ? '#525252' : 'white';
  const inputBorderColor = postType === 'secret' ? '#6a6a6a' : '#d1d5db';
  const inputTextColor = postType === 'secret' ? '#ffffff' : '#111827';
  const stepBorderColor = postType === 'secret' ? '#8a8a8a' : '#4B5563';

  // 認証チェック中は何も表示しない（リダイレクト判定中）
  if (authGuardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      <div className="py-8">
        {/* プログレスバー - 幅制限あり */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <h1 className="text-xl font-extrabold text-center mb-4" style={{ color: colors.text }}>{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-sm text-center mb-4" style={{ color: postType === 'secret' ? '#d4d4d4' : '#6b7280' }}>{pageSubtitle}</p>
          )}
          <div className="flex justify-end items-center mb-6">
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              {tForm('stepProgress', { currentStep, totalSteps })}
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
                        backgroundColor: step < currentStep ? colors.text : (postType === 'secret' ? '#6a6a6a' : '#E5E7EB'),
                        left: 'calc(50% + 20px)'
                      }}
                    />
                  )}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10"
                    style={{
                      backgroundColor: step <= currentStep ? colors.text : (postType === 'secret' ? 'transparent' : '#fff'),
                      color: step <= currentStep ? (postType === 'secret' ? '#323232' : '#fff') : (postType === 'secret' ? '#b3b3b3' : '#9CA3AF'),
                      border: step <= currentStep ? 'none' : `2px solid ${postType === 'secret' ? '#6a6a6a' : '#E5E7EB'}`
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <form onSubmit={handleSubmit} className="space-y-2">
          {/* ステップ1: プロダクト名 */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>1</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('postTitle')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('postTitleDescription')}
                </p>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (currentStep === 1 && e.target.value) setCurrentStep(2);
                  }}
                  placeholder={tForm('titlePlaceholderDetail')}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{
                    '--tw-ring-color': colors.primary,
                    backgroundColor: inputBgColor,
                    borderColor: inputBorderColor,
                    color: inputTextColor
                  } as React.CSSProperties}
                  required
                />
              </div>
            </div>
            </div>
          </div>

          {/* ステップ2: カテゴリ選択 */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>2</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('productCategoryRequired')} <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('categoryDescriptionRequired')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.appCategories.includes(category.label);
                        const newCategories = isSelected
                          ? formData.appCategories.filter(c => c !== category.label)
                          : [...formData.appCategories, category.label];
                        setFormData({ ...formData, appCategories: newCategories });
                        if (currentStep === 2 && newCategories.length > 0) setCurrentStep(3);
                      }}
                      className={`px-3 py-1 text-sm border rounded-full transition ${
                        formData.appCategories.includes(category.label)
                          ? 'font-semibold'
                          : 'hover:border-gray-400'
                      }`}
                      style={formData.appCategories.includes(category.label) ? {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        color: colors.primary
                      } : {
                        borderColor: postType === 'secret' ? inputBorderColor : '#D1D5DB',
                        color: postType === 'secret' ? textColor : '#374151'
                      }}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ3: 画像アップロード */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>3</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('productImages')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('imagesDescriptionDetail')}
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
                          {tForm('eyecatchImage')} <span className="text-red-500">*</span>
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
                          {tForm('dashboardImage')} <span className="text-red-500">*</span>
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
                          {tForm('userUiImage')} <span className="text-red-500">*</span>
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
                          {tForm('performanceImage')} <span className="text-red-500">*</span>
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
                        <p className="text-sm font-semibold text-gray-400 mt-1">{tForm('add')}</p>
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
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>4</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('appealTextRequired')} <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('appealDescriptionRequired')}
                </p>
                <textarea
                  value={formData.appealText}
                  onChange={(e) => {
                    setFormData({ ...formData, appealText: e.target.value });
                    if (currentStep === 4 && e.target.value.length >= 50) setCurrentStep(5);
                  }}
                  placeholder={tForm('appealPlaceholderDetail')}
                  rows={6}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                  style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                  required
                  minLength={50}
                />
                <p className="text-xs mt-1" style={{ color: textColor }}>
                  {tForm('characterCountDetail', { count: formData.appealText.length })}
                </p>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ5: 財務情報 */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>5</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('financialInfoTitle')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('financialDescriptionDetail')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('monthlyRevenue')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.monthlyRevenue}
                        onChange={(e) => {
                          setFormData({ ...formData, monthlyRevenue: e.target.value });
                          if (currentStep === 5 && e.target.value && formData.monthlyCost) setCurrentStep(6);
                        }}
                        placeholder={tForm('revenuePlaceholderDetail')}
                        className="w-1/3 md:flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.monthlyRevenueUnit}
                          onChange={(e) => setFormData({ ...formData, monthlyRevenueUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: inputTextColor, backgroundColor: inputBgColor, borderColor: inputBorderColor } as React.CSSProperties}
                        >
                          <option value="1">{tCommon('jpyCurrency')}</option>
                          <option value="100">{tCommon('jpyHundred')}</option>
                          <option value="1000">{tCommon('jpyThousand')}</option>
                          <option value="10000">{tCommon('jpyTenThousand')}</option>
                          <option value="100000000">{tCommon('jpyHundredMillion')}</option>
                          <option value="1000000000000">{tCommon('jpyTrillion')}</option>
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
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('monthlyCost')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.monthlyCost}
                        onChange={(e) => {
                          setFormData({ ...formData, monthlyCost: e.target.value });
                          if (currentStep === 5 && e.target.value && formData.monthlyRevenue) setCurrentStep(6);
                        }}
                        placeholder={tForm('costPlaceholderDetail')}
                        className="w-1/3 md:flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.monthlyCostUnit}
                          onChange={(e) => setFormData({ ...formData, monthlyCostUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: inputTextColor, backgroundColor: inputBgColor, borderColor: inputBorderColor } as React.CSSProperties}
                        >
                          <option value="1">{tCommon('jpyCurrency')}</option>
                          <option value="100">{tCommon('jpyHundred')}</option>
                          <option value="1000">{tCommon('jpyThousand')}</option>
                          <option value="10000">{tCommon('jpyTenThousand')}</option>
                          <option value="100000000">{tCommon('jpyHundredMillion')}</option>
                          <option value="1000000000000">{tCommon('jpyTrillion')}</option>
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
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('userCount')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.userCount}
                        onChange={(e) => setFormData({ ...formData, userCount: e.target.value })}
                        placeholder={tForm('userCountPlaceholderDetail')}
                        className="w-1/3 md:flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                      />
                      <div className="relative">
                        <select
                          value={formData.userCountUnit}
                          onChange={(e) => setFormData({ ...formData, userCountUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: inputTextColor, backgroundColor: inputBgColor, borderColor: inputBorderColor } as React.CSSProperties}
                        >
                          <option value="1">{tCommon('peopleUnit')}</option>
                          <option value="100">{tCommon('peopleHundred')}</option>
                          <option value="1000">{tCommon('peopleThousand')}</option>
                          <option value="10000">{tCommon('peopleTenThousand')}</option>
                          <option value="100000000">{tCommon('peopleHundredMillion')}</option>
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
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('releaseDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ6: 運営情報 */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>6</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('operationInfo')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('operationDescriptionDetail')}
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        {tForm('operationForm')}
                      </label>
                      <div className="relative">
                        <select
                          value={formData.operationForm}
                          onChange={(e) => {
                            setFormData({ ...formData, operationForm: e.target.value });
                            if (currentStep === 6) setCurrentStep(7);
                          }}
                          className="w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none"
                          style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                        >
                          <option value="">{tForm('selectPlaceholder')}</option>
                          <option value="individual">{tForm('individual')}</option>
                          <option value="corporate">{tForm('corporate')}</option>
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
                      <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                        {tForm('operationEffort')}
                      </label>
                      <input
                        type="text"
                        value={formData.operationEffort}
                        onChange={(e) => setFormData({ ...formData, operationEffort: e.target.value })}
                        placeholder={tForm('effortPlaceholderDetail')}
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('revenueModels')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'subscription', label: tForm('revenueModelSubscription') },
                        { key: 'advertising', label: tForm('revenueModelAdvertising') },
                        { key: 'commission', label: tForm('revenueModelCommission') },
                        { key: 'onePurchase', label: tForm('revenueModelOnePurchase') },
                        { key: 'other', label: tForm('revenueModelOther') }
                      ].map((model) => (
                        <button
                          key={model.key}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.revenueModels.includes(model.label);
                            const newModels = isSelected
                              ? formData.revenueModels.filter(m => m !== model.label)
                              : [...formData.revenueModels, model.label];
                            setFormData({ ...formData, revenueModels: newModels });
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.revenueModels.includes(model.label)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.revenueModels.includes(model.label) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: postType === 'secret' ? inputBorderColor : '#D1D5DB',
                            color: postType === 'secret' ? textColor : '#374151'
                          }}
                        >
                          {model.label}
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
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>7</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('transferInfo')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('transferDescriptionDetail')}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('transferItems')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'sourceCode', label: tForm('transferItemSourceCode') },
                        { key: 'domain', label: tForm('transferItemDomain') },
                        { key: 'sns', label: tForm('transferItemSNS') },
                        { key: 'customerData', label: tForm('transferItemCustomerData') },
                        { key: 'brand', label: tForm('transferItemBrand') },
                        { key: 'other', label: tForm('transferItemOther') }
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.transferItems.includes(item.label);
                            const newItems = isSelected
                              ? formData.transferItems.filter(i => i !== item.label)
                              : [...formData.transferItems, item.label];
                            setFormData({ ...formData, transferItems: newItems });
                            if (currentStep === 7) setCurrentStep(8);
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.transferItems.includes(item.label)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.transferItems.includes(item.label) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: postType === 'secret' ? inputBorderColor : '#D1D5DB',
                            color: postType === 'secret' ? textColor : '#374151'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('desiredTransferTiming')}
                    </label>
                    <input
                      type="text"
                      value={formData.desiredTransferTiming}
                      onChange={(e) => setFormData({ ...formData, desiredTransferTiming: e.target.value })}
                      placeholder={tForm('timingPlaceholderDetail')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('growthPotential')}
                    </label>
                    <textarea
                      value={formData.growthPotential}
                      onChange={(e) => setFormData({ ...formData, growthPotential: e.target.value })}
                      placeholder={tForm('growthPlaceholderDetail')}
                      rows={4}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ8: マーケティング情報 */}
          <div className="rounded-lg py-8 px-8" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>8</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                  {tForm('marketingInfo')}
                </h2>
                <p className="text-sm mb-4" style={{ color: textColor }}>
                  {tForm('marketingDescriptionDetail')}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('targetCustomers')}
                    </label>
                    <input
                      type="text"
                      value={formData.targetCustomers}
                      onChange={(e) => {
                        setFormData({ ...formData, targetCustomers: e.target.value });
                        if (currentStep === 8) setCurrentStep(9);
                      }}
                      placeholder={tForm('customersPlaceholderDetail')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('marketingChannels')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'seo', label: tForm('channelSEO') },
                        { key: 'snsAds', label: tForm('channelSNSAds') },
                        { key: 'contentMarketing', label: tForm('channelContentMarketing') },
                        { key: 'influencer', label: tForm('channelInfluencer') },
                        { key: 'affiliate', label: tForm('channelAffiliate') },
                        { key: 'other', label: tForm('channelOther') }
                      ].map((channel) => (
                        <button
                          key={channel.key}
                          type="button"
                          onClick={() => {
                            const isSelected = formData.marketingChannels.includes(channel.label);
                            const newChannels = isSelected
                              ? formData.marketingChannels.filter(c => c !== channel.label)
                              : [...formData.marketingChannels, channel.label];
                            setFormData({ ...formData, marketingChannels: newChannels });
                          }}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            formData.marketingChannels.includes(channel.label)
                              ? 'font-semibold'
                              : 'hover:border-gray-400'
                          }`}
                          style={formData.marketingChannels.includes(channel.label) ? {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                            color: colors.primary
                          } : {
                            borderColor: postType === 'secret' ? inputBorderColor : '#D1D5DB',
                            color: postType === 'secret' ? textColor : '#374151'
                          }}
                        >
                          {channel.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('mediaMentions')}
                    </label>
                    <textarea
                      value={formData.mediaMentions}
                      onChange={(e) => setFormData({ ...formData, mediaMentions: e.target.value })}
                      placeholder={tForm('mediaPlaceholderDetail')}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* ステップ9: 価格と追加情報 */}
          <div className="rounded-lg py-8 px-8 relative" style={{ backgroundColor: cardBgColor }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border" style={{ borderColor: stepBorderColor, backgroundColor: 'transparent' }}>
                <span className="font-bold text-base" style={{ color: labelColor }}>9</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  {/* タイトルと説明文 */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold mb-2" style={{ color: labelColor }}>
                      {tForm('priceInfo')}
                    </h2>
                    <p className="text-sm" style={{ color: textColor }}>
                      {tForm('priceDescriptionDetail')}
                    </p>
                  </div>

                  {/* AI査定 - スマホでは横並び、デスクトップではカード外側 */}
                  <div
                    className="flex flex-col items-center justify-center gap-0 lg:absolute lg:-right-[230px] lg:top-[30%] lg:-translate-y-1/2 z-10 transition-transform duration-200 lg:hover:scale-[1.1] cursor-pointer"
                    onClick={() => {
                      // TODO: 将来的にAI査定APIと連携
                      // プロジェクトの情報を元にAI査定を実行
                      // 例: const result = await callAIValuationAPI(projectData);
                      // 結果を表示またはフォームに反映
                    }}
                  >
                    <span className="text-xs lg:text-base font-semibold whitespace-nowrap text-center" style={{ color: postType === 'secret' ? textColor : '#374151' }}>
                      {tForm('aiValuation')}
                    </span>
                    <img
                      src="/ai.png"
                      alt="AI"
                      width={110}
                      height={110}
                      className="object-contain w-[110px] h-[110px] lg:w-[220px] lg:h-[220px] ml-6"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: labelColor }}>
                      {tForm('desiredPrice')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder={tForm('pricePlaceholderDetail')}
                        className="w-1/2 md:flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                        required
                      />
                      <div className="relative">
                        <select
                          value={formData.priceUnit}
                          onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                          className="pl-3 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none font-bold"
                          style={{ '--tw-ring-color': colors.primary, color: inputTextColor, backgroundColor: inputBgColor, borderColor: inputBorderColor } as React.CSSProperties}
                        >
                          <option value="1">{tCommon('jpyCurrency')}</option>
                          <option value="100">{tCommon('jpyHundred')}</option>
                          <option value="1000">{tCommon('jpyThousand')}</option>
                          <option value="10000">{tCommon('jpyTenThousand')}</option>
                          <option value="100000000">{tCommon('jpyHundredMillion')}</option>
                          <option value="1000000000000">{tCommon('jpyTrillion')}</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                          style={{ color: inputTextColor }}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('techStack')}
                    </label>
                    <input
                      type="text"
                      value={formData.techStack}
                      onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                      placeholder={tForm('techStackPlaceholderDetail')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('serviceUrls')}
                    </label>
                    <input
                      type="text"
                      value={formData.serviceUrls}
                      onChange={(e) => setFormData({ ...formData, serviceUrls: e.target.value })}
                      placeholder={tForm('urlsPlaceholderDetail')}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                      {tForm('additionalInfoLabel')}
                    </label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder={tForm('additionalPlaceholderDetail')}
                      rows={4}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': colors.primary, backgroundColor: inputBgColor, borderColor: inputBorderColor, color: inputTextColor } as React.CSSProperties}
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
                className="px-6 py-3 border rounded-lg font-semibold transition-colors"
                style={{
                  borderColor: postType === 'secret' ? inputBorderColor : '#d1d5db',
                  color: postType === 'secret' ? textColor : '#374151'
                }}
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = postType === 'secret' ? inputBgColor : colors.primaryLight;
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {tForm('cancel')}
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
                className="px-10 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-between gap-4"
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
                  ) ? undefined : (postType === 'secret' ? '#ffffff' : '#E65D65'),
                  color: postType === 'secret' ? '#323232' : '#ffffff',
                  border: postType === 'secret' ? '2px solid #ffffff' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = postType === 'secret' ? '#e8e8e8' : '#D14C54';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = postType === 'secret' ? '#ffffff' : '#E65D65';
                  }
                }}
              >
                {uploadingImage ? tForm('uploadingImages') : isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {tForm('submitting')}
                  </>
                ) : (
                  <>
                    {tForm('submitPost')}
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
