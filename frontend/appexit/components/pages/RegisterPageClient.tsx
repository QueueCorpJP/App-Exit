'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import {
  AdvisorProfileInput,
  BuyerProfileInput,
  RegistrationMethod,
  RegistrationStep3Request,
  RegistrationStep4Request,
  RegistrationStep5Request,
  SellerProfileInput,
  registerStep1,
  registerStep2,
  registerStep3,
  registerStep4,
  registerStep5,
} from '@/lib/auth-api';
import { supabase } from '@/lib/supabase';

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

const sellerCategoryOptions = ['SaaS', 'アプリ', 'Webサービス', 'メディア', 'AI', 'その他'];
const exitTimingOptions = ['即時〜3ヶ月以内', '3〜6ヶ月以内', '未定'];
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

const stepTitles = ['登録方法の選択', 'ロール選択', '基本プロフィール', '追加情報', '同意・完了'];

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
  links: string[];
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
}

interface AdvisorFormState {
  expertise: string[];
  portfolioSummary: string;
  proposalStyle: string;
}

interface AgreementsState {
  nda: boolean;
  terms: boolean;
  privacy: boolean;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">新規アカウント作成</h2>
        <span className="text-sm font-medium" style={{ color: '#323232' }}>
          ステップ {current} / {TOTAL_STEPS}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        既にアカウントをお持ちの方は{' '}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.location.assign('/login')}
          className="p-0 h-auto font-medium"
        >
          ログイン
        </Button>
      </p>
      <div className="relative">
        <div className="flex justify-between items-center">
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
  const [basicForm, setBasicForm] = useState<BasicProfileForm>({
    displayName: '',
    party: 'individual',
    prefecture: '',
    companyName: '',
    iconUrl: '',
    introduction: '',
    links: [''],
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
  });
  const [advisorForm, setAdvisorForm] = useState<AdvisorFormState>({
    expertise: [],
    portfolioSummary: '',
    proposalStyle: '',
  });
  const [agreements, setAgreements] = useState<AgreementsState>({
    nda: false,
    terms: false,
    privacy: false,
  });

  const ensureAccessToken = async (): Promise<string> => {
    if (accessToken) {
      return accessToken;
    }
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session?.access_token) {
      throw new Error('認証情報が見つかりません。再度ログインしてください。');
    }
    setAccessToken(data.session.access_token);
    return data.session.access_token;
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    setError(undefined);
    setIsLoading(true);
    try {
      const result = await registerStep1({ method: 'email', email, password });
      if (result.type !== 'email' || !result.auth) {
        throw new Error('メール登録に失敗しました');
      }
      await supabase.auth.setSession({
        access_token: result.auth.access_token,
        refresh_token: result.auth.refresh_token,
      });
      setAccessToken(result.auth.access_token);
      setSelectedMethod('email');
      setStep(2);
    } catch (err) {
      console.error('Email signup error:', err);
      setError(err instanceof Error ? err.message : 'メール登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = async (method: RegistrationMethod) => {
    setError(undefined);
    setIsLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;
      const result = await registerStep1({ method, redirect_url: redirectUrl });
      if (result.type === 'oauth' && result.provider_url) {
        window.location.href = result.provider_url;
        return;
      }
      throw new Error('OAuthの初期化に失敗しました');
    } catch (err) {
      console.error('OAuth signup error:', err);
      setError(err instanceof Error ? err.message : 'OAuthの初期化に失敗しました');
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
  };

  const updateLink = (index: number, value: string) => {
    setBasicForm((prev) => {
      const nextLinks = [...prev.links];
      nextLinks[index] = value;
      return { ...prev, links: nextLinks };
    });
  };

  const addLinkField = () => {
    setBasicForm((prev) => ({ ...prev, links: [...prev.links, ''] }));
  };

  const removeLinkField = (index: number) => {
    setBasicForm((prev) => {
      const nextLinks = prev.links.filter((_, i) => i !== index);
      return { ...prev, links: nextLinks.length > 0 ? nextLinks : [''] };
    });
  };

  const handleSubmitStep2 = async () => {
    if (selectedRoles.length === 0) {
      setError('少なくとも1つのロールを選択してください');
      return;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      const result = await registerStep2({ roles: selectedRoles }, token);
      setSelectedRoles(result.roles);
      setStep(3);
    } catch (err) {
      console.error('Step2 error:', err);
      setError(err instanceof Error ? err.message : 'ロールの保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStep3 = async () => {
    if (!basicForm.displayName.trim()) {
      setError('表示名を入力してください');
      return;
    }
    setIsLoading(true);
    try {
      const token = await ensureAccessToken();
      const payload: RegistrationStep3Request = {
        display_name: basicForm.displayName.trim(),
        party: basicForm.party,
      };
      if (basicForm.iconUrl.trim()) payload.icon_url = basicForm.iconUrl.trim();
      if (basicForm.prefecture) payload.prefecture = basicForm.prefecture;
      if (basicForm.companyName.trim()) payload.company_name = basicForm.companyName.trim();
      if (basicForm.introduction.trim()) payload.introduction = basicForm.introduction.trim();
      const cleanedLinks = basicForm.links.map((link) => link.trim()).filter((link) => link !== '');
      if (cleanedLinks.length > 0) payload.links = cleanedLinks;
      await registerStep3(payload, token);
      setStep(4);
    } catch (err) {
      console.error('Step3 error:', err);
      setError(err instanceof Error ? err.message : '基本プロフィールの保存に失敗しました');
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
      if (sellerForm.exitTiming) sellerPayload.desired_exit_timing = sellerForm.exitTiming;
      payload.seller = sellerPayload;
    }
    if (selectedRoles.includes('buyer')) {
      const buyerPayload: BuyerProfileInput = {};
      if (buyerForm.investmentMin) {
        const min = parseInt(buyerForm.investmentMin, 10);
        if (!Number.isNaN(min)) buyerPayload.investment_min = min;
      }
      if (buyerForm.investmentMax) {
        const max = parseInt(buyerForm.investmentMax, 10);
        if (!Number.isNaN(max)) buyerPayload.investment_max = max;
      }
      if (buyerForm.targetCategories.length > 0) buyerPayload.target_categories = buyerForm.targetCategories;
      if (buyerForm.operationType) buyerPayload.operation_type = buyerForm.operationType;
      payload.buyer = buyerPayload;
    }
    if (selectedRoles.includes('advisor')) {
      const advisorPayload: AdvisorProfileInput = {};
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
      console.error('Step4 error:', err);
      setError(err instanceof Error ? err.message : '追加情報の保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitStep5 = async () => {
    if (!agreements.nda) {
      setError('NDAに同意してください');
      return;
    }
    if (!agreements.terms || !agreements.privacy) {
      setError('利用規約とプライバシーポリシーに同意してください');
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
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Step5 error:', err);
      setError(err instanceof Error ? err.message : '同意情報の送信に失敗しました');
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

  const primaryButtonLabel = step === 1 ? 'メールで登録' : step === TOTAL_STEPS ? '登録を完了する' : '次へ';

  const renderStepContent = useMemo(() => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">1. 登録方法を選択</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { method: 'google' as RegistrationMethod, label: 'Googleで登録', description: 'Googleアカウントで高速登録' },
                  { method: 'github' as RegistrationMethod, label: 'GitHubで登録', description: 'GitHubアカウントで登録' },
                  { method: 'x' as RegistrationMethod, label: 'Xで登録', description: 'Xアカウントで登録' },
                ]).map(({ method, label, description }) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleOAuthSignup(method)}
                    className={`px-4 py-5 text-left border-2 transition-all duration-200 ${
                      selectedMethod === method ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-900'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="text-sm font-semibold text-gray-900">{label}</div>
                    <div className="mt-1 text-xs text-gray-500">{description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">2. メールアドレスで登録</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder="your@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    パスワード
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder="8文字以上のパスワード"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    パスワード（確認）
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder="パスワードを再入力"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">あなたの目的に合うロールを選択してください（複数選択可）</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  key: 'seller',
                  title: '売り手',
                  description: '自分のサービス・アプリを出品・査定したい',
                  emoji: '💼',
                },
                {
                  key: 'buyer',
                  title: '買い手',
                  description: 'プロダクト買収・投資案件を探したい',
                  emoji: '🛒',
                },
                {
                  key: 'advisor',
                  title: '提案者',
                  description: '改善提案や運営支援を行いたい',
                  emoji: '💡',
                },
              ].map(({ key, title, description, emoji }) => {
                const isActive = selectedRoles.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRole(key)}
                    className={`p-6 text-left border-2 transition-all duration-200 ${
                      isActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-900'
                    }`}
                  >
                    <div className="text-3xl mb-2">{emoji}</div>
                    <div className="font-semibold text-lg text-gray-900">{title}</div>
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">基本プロフィール</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">表示名</label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={basicForm.displayName}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">アカウント区分</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {[
                    { value: 'individual' as const, label: '個人' },
                    { value: 'organization' as const, label: '法人' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBasicForm((prev) => ({ ...prev, party: value }))}
                      className={`px-4 py-2 border-2 transition-all duration-200 ${
                        basicForm.party === value ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="prefecture">拠点（都道府県）</label>
                <select
                  id="prefecture"
                  value={basicForm.prefecture}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, prefecture: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                >
                  <option value="">選択してください</option>
                  {prefectures.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="companyName">
                  会社名 / 屋号（法人のみ）
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={basicForm.companyName}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  placeholder="株式会社サンプル"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="iconUrl">
                  アイコン画像URL
                </label>
                <input
                  id="iconUrl"
                  type="url"
                  value={basicForm.iconUrl}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, iconUrl: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  placeholder="https://example.com/avatar.png"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="introduction">
                  自己紹介（200字以内）
                </label>
                <textarea
                  id="introduction"
                  value={basicForm.introduction}
                  onChange={(e) => setBasicForm((prev) => ({ ...prev, introduction: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                  rows={4}
                  maxLength={200}
                  placeholder="どんな目的で登録したかなどを記入してください"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Web / SNSリンク（任意）</label>
                <div className="space-y-3 mt-2">
                  {basicForm.links.map((link, index) => (
                    <div key={`link-${index}`} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                        placeholder="https://example.com"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeLinkField(index)}
                        disabled={basicForm.links.length === 1}
                      >
                        削除
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={addLinkField}>
                    リンクを追加
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
              <section className="border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">売り手の追加情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="listingCount">
                      出品予定サービス数
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
                    <label className="block text-sm font-medium text-gray-700">サービスカテゴリ</label>
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
                    <label className="block text-sm font-medium text-gray-700">希望売却時期</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exitTimingOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSellerForm((prev) => ({ ...prev, exitTiming: option }))}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            sellerForm.exitTiming === option ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedRoles.includes('buyer') && (
              <section className="border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">買い手の追加情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">希望買収金額レンジ</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {investmentRangeOptions.map(({ label, value }) => {
                        const isSelected = buyerForm.investmentMin === String(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setBuyerForm((prev) => ({
                                ...prev,
                                investmentMin: String(value),
                                investmentMax: String(value),
                              }))
                            }
                            className={`px-3 py-1 text-sm border rounded-full transition ${
                              isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">注目カテゴリ</label>
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
                    <label className="block text-sm font-medium text-gray-700">運営体制 / 投資形態</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {operationTypes.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setBuyerForm((prev) => ({ ...prev, operationType: option }))}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            buyerForm.operationType === option ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedRoles.includes('advisor') && (
              <section className="border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">提案者の追加情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">専門領域</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {advisorExpertiseOptions.map((option) => {
                        const isActive = advisorForm.expertise.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setAdvisorForm((prev) => ({
                                ...prev,
                                expertise: isActive
                                  ? prev.expertise.filter((v) => v !== option)
                                  : [...prev.expertise, option],
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="portfolioSummary">
                      実績・スキル概要
                    </label>
                    <textarea
                      id="portfolioSummary"
                      value={advisorForm.portfolioSummary}
                      onChange={(e) => setAdvisorForm((prev) => ({ ...prev, portfolioSummary: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:border-gray-900 focus:outline-none"
                      rows={4}
                      maxLength={400}
                      placeholder="簡易ポートフォリオや得意領域を記入してください"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">提案スタイル</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {proposalStyleOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setAdvisorForm((prev) => ({ ...prev, proposalStyle: option }))}
                          className={`px-3 py-1 text-sm border rounded-full transition ${
                            advisorForm.proposalStyle === option
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-200 text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {selectedRoles.length === 0 && (
              <p className="text-sm text-gray-600">ステップ2でロールを選択すると、ここに対応する入力項目が表示されます。</p>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">同意事項</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 border-gray-300"
                  checked={agreements.nda}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, nda: e.target.checked }))}
                  required
                />
                <span>
                  <span className="font-medium">NDA（秘密保持契約）の締結に同意します（必須）</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 border-gray-300"
                  checked={agreements.terms}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, terms: e.target.checked }))}
                  required
                />
                <span>
                  <span className="font-medium">利用規約</span>に同意します（必須）{' '}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/terms', '_blank')}
                    className="p-0 h-auto ml-1 underline"
                  >
                    内容を確認する
                  </Button>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-gray-900">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 border-gray-300"
                  checked={agreements.privacy}
                  onChange={(e) => setAgreements((prev) => ({ ...prev, privacy: e.target.checked }))}
                  required
                />
                <span>
                  <span className="font-medium">プライバシーポリシー</span>に同意します（必須）{' '}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/privacy', '_blank')}
                    className="p-0 h-auto ml-1 underline"
                  >
                    内容を確認する
                  </Button>
                </span>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [
    step,
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
  ]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <StepIndicator current={step} />
        <div className="bg-white py-8 px-6 sm:px-10">
          <form onSubmit={handleSubmit}>
            {renderStepContent}
            {error && (
              <div className="mt-6 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="mt-8 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
                disabled={isLoading || step === 1}
              >
                戻る
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {primaryButtonLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}