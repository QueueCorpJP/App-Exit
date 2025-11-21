'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Button from '@/components/ui/Button';
import {
  AdvisorProfileInput,
  BuyerProfileInput,
  RegistrationMethod,
  RegistrationStep3Request,
  RegistrationStep4Request,
  RegistrationStep5Request,
  SellerProfileInput,
  UserLinkInput,
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  registerStep5,
  getApiUrl,
} from '@/lib/auth-api';
import { UserRound, Building, Camera, X } from 'lucide-react';
import RoleSelector from '@/components/register/RoleSelector';
import { uploadAvatarImage } from '@/lib/storage';

const TOTAL_STEPS = 5;

const prefectures = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
];

const sellerCategoryOptions = [
  'SaaS', 
  'アプリ', 
  'Webサービス', 
  'メディア', 
  'AI', 
  'EC', 
  'マッチング', 
  'SNS',
  'ゲーム',
  'FinTech',
  'EdTech',
  'HealthTech',
  'HRTech',
  'BtoB',
  'BtoC',
  'プラットフォーム',
  'コミュニティ',
  'コンテンツ',
  'その他'
];
const investmentRangeOptions = [
  { label: '〜100万円', value: 1_000_000 },
  { label: '100〜500万円', value: 5_000_000 },
  { label: '500〜1000万円', value: 10_000_000 },
  { label: '1000〜3000万円', value: 30_000_000 },
  { label: '3000万円〜', value: 50_000_000 },
];
const operationTypes = ['内製', '外注', 'ファンド', '個人投資', 'その他'];
const advisorExpertiseOptions = ['PM', 'デザイン', 'マーケ', '開発', '営業', 'CS'];
const proposalStyleOptions = ['協業', '改善提案', 'レベニューシェア', '業務委託'];

// Removed stepTitles - not used in the component

interface RegisterPageClientProps {
  error?: string;
}

interface BasicProfileForm {
  displayName: string;
  party: 'individual' | 'organization';
  prefecture: string;
  companyName: string;
  iconUrl: string;
  introduction: string;
  links: UserLinkInput[];
}

interface SellerFormState {
  listingCount: string;
  serviceCategories: string[];
  exitTiming: string;
}

interface BuyerFormState {
  investmentMin: string;
  investmentMax: string;
  targetCategories: string[];
  operationType: string;
  desiredAcquisitionTiming: string;
}

interface AdvisorFormState {
  investmentMin: string;
  investmentMax: string;
  targetCategories: string[];
  desiredAcquisitionTiming: string;
  expertise: string[];
  portfolioSummary: string;
  proposalStyle: string;
}

interface AgreementsState {
  nda: boolean;
  terms: boolean;
  privacy: boolean;
}

function StepIndicator({ current, t, locale }: { current: number; t: any; locale: string }) {
  return (
    <div className="mb-8">
      <div className="flex justify-center mb-6">
        <img src="/icon.png" alt="AppExit" className="h-12 w-auto" />
      </div>
      <div className="flex justify-between items-center mb-6 px-2 sm:px-0">
        <div className="w-16 sm:w-32"></div>
        <h2 className="register-title-custom mb-0">{t('header.register')}</h2>
        <div className="w-16 sm:w-32 text-right">
          <span className="text-sm font-medium" style={{ color: '#323232' }}>
            {t('registerStepIndicator', { current, total: TOTAL_STEPS })}
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="flex justify-between items-center px-2 sm:px-0">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex flex-col items-center relative" style={{ flex: 1 }}>
              {step < TOTAL_STEPS && (
                <div
                  className="absolute top-5 left-1/2 h-0.5 transition-all duration-300"
                  style={{
                    width: 'calc(100% - 40px)',
                    backgroundColor: step < current ? '#323232' : '#E5E7EB',
                    left: 'calc(50% + 20px)'
                  }}
                />
              )}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10"
                style={{
                  backgroundColor: step <= current ? '#323232' : '#fff',
                  color: step <= current ? '#fff' : '#9CA3AF',
                  border: step <= current ? 'none' : '2px solid #E5E7EB'
                }}
              >
                {step < current ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
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
  );
}

export default function RegisterPageClient({ error: serverError }: RegisterPageClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string | undefined>(serverError);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<RegistrationMethod | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showMethodOptions, setShowMethodOptions] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPrefectureFocused, setIsPrefectureFocused] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [basicForm, setBasicForm] = useState<BasicProfileForm>({
    displayName: '',
    party: 'individual',
    prefecture: '',
    companyName: '',
    iconUrl: '',
    introduction: '',
    links: [{ name: '', url: '' }],
  });
  const [sellerForm, setSellerForm] = useState<SellerFormState>({
    listingCount: '',
    serviceCategories: [],
    exitTiming: '',
  });
  const [buyerForm, setBuyerForm] = useState<BuyerFormState>({
    investmentMin: '',
    investmentMax: '',
    targetCategories: [],
    operationType: '',
    desiredAcquisitionTiming: '',
  });
  const [advisorForm, setAdvisorForm] = useState<AdvisorFormState>({
    investmentMin: '',
    investmentMax: '',
    targetCategories: [],
    desiredAcquisitionTiming: '',
    expertise: [],
    portfolioSummary: '',
    proposalStyle: '',
  });
  const [agreements, setAgreements] = useState<AgreementsState>({
    nda: false,
    terms: false,
    privacy: false,
  });

  // OAuthで戻ってきてバックエンドCookieがある場合はステップ2へ進める
  useEffect(() => {
    const checkSessionAndAdvance = async () => {
      if (step !== 1) return;

      // バックエンドのセッションをチェック
      const apiUrl = getApiUrl();

      // URLフラグメントからSupabaseのセッショントークンを取得
      const hash = window.location.hash;

      if (hash && hash.includes('access_token')) {
        try {
          // URLフラグメントからトークン情報を抽出
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
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

            if (sessionResponse.ok) {
              const result = await sessionResponse.json();

              // URLフラグメントをクリア
              window.history.replaceState(null, '', window.location.pathname + window.location.search);

              // プロフィールが未作成または登録未完了の場合はステップ2へ
              if (result.data && (!result.data.profile || result.data.profile.registration_step < 5)) {
                setSelectedMethod('github'); // または適切なメソッドを設定
                setStep(2);
              } else if (result.data && result.data.profile && result.data.profile.registration_step >= 5) {
                // 登録が完了している場合はホームへリダイレクト
                router.push('/');
              }
              return;
            } else {
              const errorData = await sessionResponse.json().catch(() => ({ error: 'セッションの確立に失敗しました' }));
              setError(errorData.error || 'セッションの確立に失敗しました');
            }
          }
        } catch (error) {
          setError('OAuth認証の処理中にエラーが発生しました');
        }
      }

      // 通常のセッションチェック（URLフラグメントがない場合）
      try {
        const response = await fetch(`${apiUrl}/api/auth/session`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          const result = await response.json();
          // セッションがあり、かつプロフィールが未作成の場合はステップ2へ
          if (result.data && !result.data.profile) {
            // OAuthの場合、トークンは不要（Cookie認証）
            setSelectedMethod('google'); // または適切なメソッドを設定
            setStep(2);
          }
        }
      } catch (error) {
        // Session check error - silently fail
      }
    };
    checkSessionAndAdvance();
  }, [step, router]);

  const ensureAccessToken = async (): Promise<string> => {
    if (accessToken) {
      return accessToken;
    }
    // Cookie認証の場合、トークンは不要
    // バックエンドがCookieを確認する
    // ダミートークンを返す（実際はCookieが使われる）
    return 'cookie-auth';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('registerImageSizeLimit'));
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError(t('registerSelectImage'));
      return;
    }

    setAvatarFile(file);
    
    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 即座にアップロード
    setIsUploadingAvatar(true);
    setError(undefined);
    try {
      // ユーザーIDを取得（バックエンドセッションから）
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      let userId: string | undefined;
      if (response.ok) {
        const result = await response.json();
        userId = result.data?.id;
      }

      const publicUrl = await uploadAvatarImage(file, userId);
      setBasicForm((prev) => ({ ...prev, iconUrl: publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerUploadFailed'));
      setAvatarFile(null);
      setAvatarPreview('');
      // エラー時でもプレビューは残す
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError(t('registerEnterEmailPassword'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('registerPasswordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('registerPasswordLength'));
      return;
    }

    setError(undefined);
    setIsLoading(true);
    try {
      const result = await registerStep1({ method: 'email', email, password });
      if (result.type !== 'email' || !result.auth) {
        throw new Error(t('registerEmailFailed'));
      }
      // バックエンドがHTTPOnly Cookieを設定済み
      // トークンは後続のstep2-5で使用するため保持
      setAccessToken(result.auth.access_token);
      setSelectedMethod('email');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerEmailFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (method: RegistrationMethod) => {
    setError(undefined);
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/register` : undefined;
      const result = await registerStep1({ method, redirect_url: redirectUrl });
      if (result.type === 'oauth' && result.provider_url) {
        window.location.href = result.provider_url;
        return;
      }
      throw new Error(t('registerOAuthFailed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerOAuthFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      }
      return [...prev, role];
    });
    // ロール選択時にエラーをクリア
    const errorMessages = ['少なくとも1つのロールを選択してください', 'Please select at least one role'];
    if (errorMessages.includes(error || '')) {
      setError(undefined);
    }
  };

  const updateLink = (index: number, field: 'name' | 'url', value: string) => {
    setBasicForm((prev) => {
      const nextLinks = [...prev.links];
      nextLinks[index] = { ...nextLinks[index], [field]: value };
      return { ...prev, links: nextLinks };
    });
  };

  const addLinkField = () => {
    setBasicForm((prev) => ({ ...prev, links: [...prev.links, { name: '', url: '' }] }));
  };

  const removeLinkField = (index: number) => {
    setBasicForm((prev) => {
      const nextLinks = prev.links.filter((_, i) => i !== index);
      return { ...prev, links: nextLinks.length > 0 ? nextLinks : [{ name: '', url: '' }] };
    });
  };

  const handleSubmitStep2 = async () => {
    if (selectedRoles.length === 0) {
      setError(t('registerSelectRole'));
      return;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      const rolesPayload = Array.from(
        new Set(
          selectedRoles
            .map((r) => r.toLowerCase().trim())
            .filter((r) => r.length > 0)
        )
      );
      const result = await registerStep2({ roles: rolesPayload }, token);
      setSelectedRoles(result.roles);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerSaveRolesFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStep3 = async () => {
    if (!basicForm.displayName.trim()) {
      setError(t('registerEnterDisplayName'));
      return;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      const payload: RegistrationStep3Request = {
        display_name: basicForm.displayName.trim(),
        party: basicForm.party,
        roles: selectedRoles,
      };
      if (basicForm.iconUrl.trim()) payload.icon_url = basicForm.iconUrl.trim();
      if (basicForm.prefecture) payload.prefecture = basicForm.prefecture;
      if (basicForm.companyName.trim()) payload.company_name = basicForm.companyName.trim();
      if (basicForm.introduction.trim()) payload.introduction = basicForm.introduction.trim();
      const cleanedLinks = basicForm.links
        .filter((link) => link.name.trim() !== '' && link.url.trim() !== '')
        .map((link) => ({ name: link.name.trim(), url: link.url.trim() }));
      if (cleanedLinks.length > 0) payload.links = cleanedLinks;
      await registerStep3(payload, token);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerSaveProfileFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStep4 = async () => {
    const payload: RegistrationStep4Request = {};
    if (selectedRoles.includes('seller')) {
      const sellerPayload: SellerProfileInput = {};
      if (sellerForm.listingCount) {
        const count = parseInt(sellerForm.listingCount, 10);
        if (!Number.isNaN(count)) sellerPayload.listing_count = count;
      }
      if (sellerForm.serviceCategories.length > 0) sellerPayload.service_categories = sellerForm.serviceCategories;
      if (sellerForm.exitTiming) {
        const months = parseInt(sellerForm.exitTiming, 10);
        if (!Number.isNaN(months) && months > 0) {
          sellerPayload.desired_exit_timing = `${months}ヶ月以内`;
        }
      }
      payload.seller = sellerPayload;
    }
    if (selectedRoles.includes('buyer')) {
      const buyerPayload: BuyerProfileInput = {};
      if (buyerForm.investmentMin) {
        const min = parseInt(buyerForm.investmentMin, 10);
        if (!Number.isNaN(min)) buyerPayload.investment_min = min * 10000; // 万円を円に変換
      }
      if (buyerForm.investmentMax) {
        const max = parseInt(buyerForm.investmentMax, 10);
        if (!Number.isNaN(max)) buyerPayload.investment_max = max * 10000; // 万円を円に変換
      }
      if (buyerForm.targetCategories.length > 0) buyerPayload.target_categories = buyerForm.targetCategories;
      if (buyerForm.operationType) buyerPayload.operation_type = buyerForm.operationType;
      if (buyerForm.desiredAcquisitionTiming) {
        const months = parseInt(buyerForm.desiredAcquisitionTiming, 10);
        if (!Number.isNaN(months) && months > 0) {
          buyerPayload.desired_acquisition_timing = `${months}ヶ月以内`;
        }
      }
      payload.buyer = buyerPayload;
    }
    if (selectedRoles.includes('advisor')) {
      const advisorPayload: AdvisorProfileInput = {};
      
      // 買い手の投資情報を提案者にもコピー（提案者は買い手のフォームを使う）
      if (selectedRoles.includes('buyer')) {
        if (buyerForm.investmentMin) {
          const min = parseInt(buyerForm.investmentMin, 10);
          if (!Number.isNaN(min)) advisorPayload.investment_min = min * 10000; // 万円を円に変換
        }
        if (buyerForm.investmentMax) {
          const max = parseInt(buyerForm.investmentMax, 10);
          if (!Number.isNaN(max)) advisorPayload.investment_max = max * 10000; // 万円を円に変換
        }
        if (buyerForm.targetCategories.length > 0) advisorPayload.target_categories = buyerForm.targetCategories;
        if (buyerForm.desiredAcquisitionTiming) {
          const months = parseInt(buyerForm.desiredAcquisitionTiming, 10);
          if (!Number.isNaN(months) && months > 0) {
            advisorPayload.desired_acquisition_timing = `${months}ヶ月以内`;
          }
        }
      }
      
      // 提案者固有の情報
      if (advisorForm.expertise.length > 0) advisorPayload.expertise = advisorForm.expertise;
      if (advisorForm.portfolioSummary.trim()) advisorPayload.portfolio_summary = advisorForm.portfolioSummary.trim();
      if (advisorForm.proposalStyle) advisorPayload.proposal_style = advisorForm.proposalStyle;
      payload.advisor = advisorPayload;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      await registerStep4(payload, token);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerSaveInfoFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStep5 = async () => {
    // NDAは任意なのでチェックを削除
    if (!agreements.terms || !agreements.privacy) {
      setError(t('registerAgreeTermsPrivacy'));
      return;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      const payload: RegistrationStep5Request = {
        nda_agreed: agreements.nda,
        terms_accepted: agreements.terms,
        privacy_accepted: agreements.privacy,
      };
      await registerStep5(payload, token);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registerSubmitAgreementFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    if (step === 1) {
      await handleEmailSignup();
    } else if (step === 2) {
      await handleSubmitStep2();
    } else if (step === 3) {
      await handleSubmitStep3();
    } else if (step === 4) {
      await handleSubmitStep4();
    } else if (step === 5) {
      await handleSubmitStep5();
    }
  };

  const primaryButtonLabel = step === 1 ? t('auth.emailRegister') : step === TOTAL_STEPS ? t('auth.completeRegistration') : t('auth.next');

  const renderStepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <button
                type="button"
                onClick={() => setShowMethodOptions(!showMethodOptions)}
                className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
              >
                <div className="text-base font-semibold text-gray-900">1. {t('auth.socialRegister')}</div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showMethodOptions ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {showMethodOptions && (
                <div className="mt-3 space-y-3">
                  {([
                    { method: 'google' as RegistrationMethod, label: t('auth.registerWithGoogle') },
                    { method: 'github' as RegistrationMethod, label: t('auth.registerWithGithub') },
                  ]).map(({ method, label }) => (
                    <Button
                      key={method}
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOAuthSignup(method)}
                      isLoading={isLoading}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-6">
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-2xl">
                  <span className="px-6 bg-white text-gray-300 font-black">or</span>
                </div>
              </div>
              <div className="px-4 py-3 mb-4">
                <h3 className="text-base font-semibold text-gray-900">2. {t('auth.emailRegister')}</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('auth.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('auth.password')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder={t('registerReenterPassword')}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              {t('registerSelectRoles')}
            </h3>
            <RoleSelector
              selectedRoles={selectedRoles}
              onToggle={(key) => toggleRole(key)}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold" style={{ color: '#323232' }}>
              {t('registerBasicProfile')}
            </h3>
            <div className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
                  {t('displayName')}
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={basicForm.displayName}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  placeholder={t('displayNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('accountType')}
                </label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {[
                    { value: 'individual' as const, label: t('individual') },
                    { value: 'organization' as const, label: t('organization') },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBasicForm((prev) => ({ ...prev, party: value }))}
                      className={`px-4 py-3 border border-gray-200 rounded-md transition ${
                        basicForm.party === value ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                      } flex items-center justify-center gap-2 text-gray-900`}
                    >
                      {value === 'individual' ? (
                        <UserRound className="w-4 h-4" />
                      ) : (
                        <Building className="w-4 h-4" />
                      )}
                      <span className="font-bold text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  maxHeight: basicForm.party === 'organization' ? '200px' : '0',
                  opacity: basicForm.party === 'organization' ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.2s ease, opacity 0.2s ease'
                }}
              >
                <label className="block text-sm font-medium text-gray-700" htmlFor="prefecture">
                  {t('registerPrefecture')}
                </label>
                <div className="relative">
                  <select
                    id="prefecture"
                    value={basicForm.prefecture}
                    onChange={(e) => {
                      setBasicForm((prev) => ({ ...prev, prefecture: e.target.value }));
                      // 選択によりドロップダウンが閉じたタイミングでアイコンを元に戻す
                      setIsPrefectureFocused(false);
                    }}
                    onFocus={() => setIsPrefectureFocused(true)}
                    onBlur={() => setIsPrefectureFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        // Escで閉じた場合も確実に戻す
                        setIsPrefectureFocused(false);
                      }
                    }}
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none appearance-none bg-white"
                  >
                    <option value="">{t('registerPleaseSelect')}</option>
                    {prefectures.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                  <div
                    className="absolute right-3 top-1/2 pointer-events-none"
                    style={{
                      transform: `translateY(-50%) rotate(${isPrefectureFocused ? '180deg' : '0deg'})`,
                      transition: 'transform 0.2s ease',
                      marginTop: '0.5px'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="#323232" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div
                style={{
                  maxHeight: basicForm.party === 'organization' ? '200px' : '0',
                  opacity: basicForm.party === 'organization' ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.2s ease, opacity 0.2s ease'
                }}
              >
                <label className="block text-sm font-medium text-gray-700" htmlFor="companyName">
                  {t('registerCompanyName')}
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={basicForm.companyName}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  placeholder={t('registerCompanyPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profilePicture')}
                </label>
                <div className="flex items-center space-x-4">
                  {/* プレビュー画像 - クリック可能 */}
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <label
                    htmlFor="avatarInput"
                    className={`relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group ${
                      isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* 背景画像 */}
                    {avatarPreview || basicForm.iconUrl ? (
                      <img
                        src={avatarPreview || basicForm.iconUrl}
                        alt={t('iconPreview')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">👤</span>
                      </div>
                    )}
                    {/* 薄暗いオーバーレイとカメラアイコン */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-all">

                      <Camera className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                  </label>
                  {isUploadingAvatar && (
                    <span className="text-sm text-gray-600">
                      {t('uploading')}
                    </span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="introduction">
                  {t('registerIntroduction')}
                </label>
                <textarea
                  id="introduction"
                  value={basicForm.introduction}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, introduction: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  rows={4}
                  maxLength={200}
                  placeholder={t('registerIntroductionPlaceholder')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('registerLinks')}
                </label>
                <div className="space-y-3 mt-2">
                  {basicForm.links.map((link, index) => (
                    <div key={`link-${index}`} className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => updateLink(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                          placeholder={t('registerLinkNamePlaceholder')}
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                          placeholder="https://example.com"
                        />
                        {basicForm.links.length > 1 && (link.name || link.url) && (
                          <button
                            type="button"
                            onClick={() => removeLinkField(index)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={addLinkField}>
                    {t('registerAddLink')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            {selectedRoles.includes('seller') && (
              <section className="">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('registerSellerInfo')}
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="listingCount">
                      {t('registerListingCount')}
                    </label>
                    <input
                      id="listingCount"
                      type="number"
                      min="0"
                      value={sellerForm.listingCount}
                      onChange={(e) => setSellerForm((prev) => ({ ...prev, listingCount: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerServiceCategories')}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sellerCategoryOptions.map((option) => {
                        const isActive = sellerForm.serviceCategories.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setSellerForm((prev) => ({
                                ...prev,
                                serviceCategories: isActive
                                  ? prev.serviceCategories.filter((v) => v !== option)
                                  : [...prev.serviceCategories, option],
                              }))
                            }
                            className={`px-3 py-1 text-sm border rounded-full transition ${
                              isActive ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="exitTiming">
                      {t('registerExitTiming')}
                    </label>
                    <input
                      id="exitTiming"
                      type="number"
                      min="1"
                      max="99"
                      value={sellerForm.exitTiming}
                      onChange={(e) => setSellerForm((prev) => ({ ...prev, exitTiming: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                      placeholder={t('registerTimingPlaceholder')}
                    />
                  </div>
                </div>
              </section>
            )}

            {(selectedRoles.includes('buyer') || selectedRoles.includes('advisor')) && (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedRoles.includes('advisor')
                    ? t('registerBuyerAdvisorInfo')
                    : t('registerBuyerInfo')}
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerInvestmentRange')}
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={buyerForm.investmentMin}
                        onChange={(e) => setBuyerForm((prev) => ({ ...prev, investmentMin: e.target.value }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                        placeholder={t('registerMinimum')}
                      />
                      <span className="font-bold text-gray-900 text-sm">
                        {t('registerMinCurrency')}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={buyerForm.investmentMax}
                        onChange={(e) => setBuyerForm((prev) => ({ ...prev, investmentMax: e.target.value }))}
                        className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                        placeholder={t('registerMaximum')}
                      />
                      <span className="font-bold text-gray-900 text-sm">
                        {t('registerMaxCurrency')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerTargetCategories')}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sellerCategoryOptions.map((option) => {
                        const isActive = buyerForm.targetCategories.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setBuyerForm((prev) => ({
                                ...prev,
                                targetCategories: isActive
                                  ? prev.targetCategories.filter((v) => v !== option)
                                  : [...prev.targetCategories, option],
                              }))
                            }
                            className={`px-3 py-1 text-sm border rounded-full transition ${
                              isActive ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="buyerDesiredAcquisitionTiming">
                      {t('registerAcquisitionTiming')}
                    </label>
                    <input
                      id="buyerDesiredAcquisitionTiming"
                      type="number"
                      min="1"
                      max="99"
                      value={buyerForm.desiredAcquisitionTiming}
                      onChange={(e) => setBuyerForm((prev) => ({ ...prev, desiredAcquisitionTiming: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                      placeholder={t('registerAcquisitionPlaceholder')}
                    />
                  </div>
                </div>
              </section>
            )}

            {selectedRoles.length === 0 && (
              <p className="text-sm text-gray-600">
                {t('registerSelectRolesHint')}
              </p>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold" style={{ color: '#323232' }}>
              {t('registerAgreements')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 border-gray-300"
                  style={{ accentColor: '#323232' }}
                  checked={agreements.nda}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, nda: e.target.checked }))}
                />
                <span>
                  <button
                    type="button"
                    onClick={() => window.open(`/${locale}/nda`, '_blank')}
                    className="font-medium underline hover:text-blue-600"
                  >
                    {t('registerAgreeNDALabel')}
                  </button>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 border-gray-300"
                  style={{ accentColor: '#323232' }}
                  checked={agreements.terms}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, terms: e.target.checked }))}
                  required
                />
                <span>
                  <button
                    type="button"
                    onClick={() => window.open(`/${locale}/terms`, '_blank')}
                    className="font-medium underline hover:text-blue-600"
                  >
                    {t('registerAgreeTermsLabel')}
                  </button>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 border-gray-300"
                  style={{ accentColor: '#323232' }}
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, privacy: e.target.checked }))}
                  required
                />
                <span>
                  <button
                    type="button"
                    onClick={() => window.open(`/${locale}/privacy`, '_blank')}
                    className="font-medium underline hover:text-blue-600"
                  >
                    {t('registerAgreePrivacyLabel')}
                  </button>
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [
    step,
    showMethodOptions,
    selectedMethod,
    isLoading,
    email,
    password,
    confirmPassword,
    selectedRoles,
    basicForm,
    sellerForm,
    buyerForm,
    advisorForm,
    agreements,
    isPrefectureFocused,
    isUploadingAvatar,
    avatarPreview,
  ]);

  return (
    <>
      
      <style dangerouslySetInnerHTML={{__html: `
        .register-title-custom {
          color: #323232 !important;
          font-weight: 900 !important;
          font-size: 1.125rem !important;
          text-align: center !important;
          margin-bottom: 0 !important;
          -webkit-text-stroke: 0.1px #323232 !important;
          text-stroke: 0.1px #323232 !important;
          letter-spacing: 0.02em !important;
        }
      `}} />

      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <StepIndicator current={step} t={t} locale={locale} />
        <div className="bg-white py-8 px-6 sm:px-10">
          <form onSubmit={handleSubmit}>
            {renderStepContent}
            {error && (
              <div className="mt-6 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="mt-8 space-y-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full"
                style={{
                  backgroundColor: isHovered ? '#D14C54' : '#E65D65',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {primaryButtonLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || step === 1}
                className="w-full"
              >
                {t('auth.back')}
              </Button>
            </div>
          </form>
        </div>
        <div className="mt-4 py-4 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/login`)}
              className="p-0 h-auto font-medium"
            >
              {t('auth.loginButton')}
            </Button>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}