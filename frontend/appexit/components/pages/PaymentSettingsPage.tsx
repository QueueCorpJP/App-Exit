'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, ExternalLink, AlertTriangle, CreditCard, Building2, User, ShoppingCart, Store } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'

// Stripeアカウントの状態を表す型
interface StripeAccountStatus {
  hasAccount: boolean
  accountId?: string
  onboardingCompleted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDue: string[]
  tosAcceptedAt?: string
  tosAcceptedIp?: string
}

// 精算情報の型
interface PayoutInfo {
  totalEarnings: number
  pendingAmount: number
  availableAmount: number
  lastPayoutDate?: string
  nextPayoutDate?: string
}

type AccountType = 'buyer' | 'seller'

interface PaymentSettingsPageProps {
  pageDict?: any;
  locale: string;
}

export default function PaymentSettingsPage({ pageDict, locale: propLocale }: PaymentSettingsPageProps) {
  const t = useTranslations()
  const locale = propLocale
  const router = useRouter()
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [isHovered, setIsHovered] = useState<{ buyer?: boolean; seller?: boolean }>({})
  const [isOnboardingHovered, setIsOnboardingHovered] = useState(false)

  // Stripeアカウント情報
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null)
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null)
  const [userParty, setUserParty] = useState<'individual' | 'organization'>('individual')

  // TOS同意の状態
  const [tosAccepted, setTosAccepted] = useState(false)

  // ユーザーのroleを取得
  const getUserRoles = (): string[] => {
    if (profile?.roles && profile.roles.length > 0) {
      return profile.roles
    }
    return profile?.role ? [profile.role] : []
  }

  // 表示するアカウントタイプを決定
  const getAccountTypes = (): AccountType[] => {
    const roles = getUserRoles()

    if (roles.includes('advisor')) {
      return ['seller'] // 仲介も売り手アカウントのみ作成可能
    } else if (roles.includes('seller')) {
      return ['seller']
    } else if (roles.includes('buyer')) {
      return [] // 買い手はStripeアカウント不要（決済時にCustomer作成）
    }
    return []
  }

  useEffect(() => {
    loadPaymentSettings()
  }, [])

  const loadPaymentSettings = async () => {
    try {
      setIsLoading(true)
      setError('')

      // バックエンドAPIからStripeアカウント情報を取得
      const result = await apiClient.get<{ data: { account_status: StripeAccountStatus; payout_info?: PayoutInfo } }>('/api/stripe/account-status')

      if (result.data) {
        setAccountStatus(result.data.account_status)
        if (result.data.payout_info) {
          setPayoutInfo(result.data.payout_info)
        }
      }

      // プロフィールからparty情報を取得
      if (profile?.party) {
        setUserParty(profile.party as 'individual' | 'organization')
      }
    } catch (err: any) {
      console.error('Failed to load payment settings:', err)
      // 404の場合はアカウント未作成として扱う
      if (err.status === 404) {
        setAccountStatus({
          hasAccount: false,
          onboardingCompleted: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          requirementsDue: [],
        })
      } else {
        // その他のエラーもアカウント未作成として扱う
        setAccountStatus({
          hasAccount: false,
          onboardingCompleted: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          requirementsDue: [],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateStripeAccount = async (accountType: AccountType) => {
    if (!tosAccepted) {
      alert(t('agreeToTOS'))
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // バックエンドAPIを呼び出してStripeオンボーディングリンクを取得
      const result = await apiClient.post<{ data: { url: string } }>('/api/stripe/create-onboarding-link', {
        account_type: accountType,
        return_url: `${window.location.origin}/settings/payment?success=true`,
        refresh_url: `${window.location.origin}/settings/payment?refresh=true`,
      })

      // Stripeのオンボーディングページにリダイレクト
      if (result.data?.url) {
        window.location.href = result.data.url
      } else {
        throw new Error(t('failedToGetURL'))
      }
    } catch (error: any) {
      console.error('Stripeオンボーディングリンク取得エラー:', error)
      setError(error.message || t('failedToGetLink'))
      setIsProcessing(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const result = await apiClient.get<{ data: { url: string } }>('/api/stripe/onboarding-link')

      // Stripeの本人確認ページにリダイレクト
      if (result.data?.url) {
        window.location.href = result.data.url
      } else {
        throw new Error(t('failedToGetURL'))
      }
    } catch (error: any) {
      console.error('本人確認フローエラー:', error)
      setError(error.message || t('failedToStartVerification'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefreshStatus = async () => {
    await loadPaymentSettings()
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const accountTypes = getAccountTypes()

  // アカウントタイプ別の説明とアイコンを取得
  const getAccountTypeInfo = (accountType: AccountType) => {
    switch (accountType) {
      case 'seller':
        return {
          icon: Store,
          title: t('sellerAccount'),
          description: t('sellerAccountDescription'),
          buttonText: t('createSellerStripeAccount'),
          color: 'green'
        }
      case 'buyer':
      default:
        // 買い手は使用されない（決済時にCustomer作成）
        return {
          icon: ShoppingCart,
          title: t('buyerAccount'),
          description: t('buyerAccountDescription'),
          buttonText: '',
          color: 'blue'
        }
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-lg text-center mb-2" style={{ color: '#323232', fontWeight: 900 }}>
          {t('paymentSettings')}
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          {t('configurePayments')}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 買い手の場合の案内メッセージ */}
        {getUserRoles().includes('buyer') && !getUserRoles().includes('seller') && !getUserRoles().includes('advisor') && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-sm mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">
                  {t('buyersNoStripeNeeded')}
                </p>
                <p className="text-sm">
                  {t('buyersNoStripeDesc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* roleが設定されていない場合の警告 */}
        {accountTypes.length === 0 && !getUserRoles().includes('buyer') && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-sm mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>
              {t('roleNotSet')}
            </span>
          </div>
        )}

        {/* Stripeアカウント未作成の場合 */}
        {!accountStatus?.hasAccount && accountTypes.length > 0 && (
          <div className="space-y-6">
            {/* 利用規約同意（全体で一つ） */}
            <div className="bg-white p-6 rounded-sm shadow-sm">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-700">
                  {locale === 'ja' ? (
                    <>
                      <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        {t('termsOfService')}
                      </a>
                      、
                      <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        {t('privacyPolicy')}
                      </a>
                      、および
                      <a href="https://stripe.com/jp/legal/connect-account" target="_blank" className="text-blue-600 hover:underline">
                        {t('stripeTerms')}
                      </a>
                      {t('agreeToTermsPrefix')}
                    </>
                  ) : (
                    <>
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
                        {t('termsOfService')}
                      </a>
                      ,{' '}
                      <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                        {t('privacyPolicy')}
                      </a>
                      , and{' '}
                      <a href="https://stripe.com/legal/connect-account" target="_blank" className="text-blue-600 hover:underline">
                        {t('stripeTerms')}
                      </a>
                      {t('agreeToTermsPrefix')}
                    </>
                  )}
                </span>
              </label>
            </div>

            {accountTypes.map((accountType) => {
              const info = getAccountTypeInfo(accountType)
              const Icon = info.icon
              return (
                <div key={accountType} className="bg-white p-8 rounded-sm shadow-sm">
                  <div className="flex items-start mb-6">
                    <Icon className={`w-8 h-8 text-${info.color}-600 mr-4 flex-shrink-0`} />
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 mb-2">
                        {info.title}
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
                        {info.description}
                        {locale === 'ja'
                          ? (userParty === 'individual' ? t('individual') : t('organization')) + 'として登録されます。'
                          : 'You will be registered as ' + (userParty === 'individual' ? 'an individual' : 'an organization') + '.'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {t('requiredInformation')}
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1 ml-7">
                      {userParty === 'individual' ? (
                        <>
                          <li>• {t('identityDocuments')}</li>
                          <li>• {t('bankAccountInfo')}</li>
                          <li>• {t('addressPhone')}</li>
                          <li>• {t('dateOfBirth')}</li>
                        </>
                      ) : (
                        <>
                          <li>• {t('corporateRegistration')}</li>
                          <li>• {t('representativeIdentity')}</li>
                          <li>• {t('corporateBankAccount')}</li>
                          <li>• {t('corporateAddressPhone')}</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* アカウント作成ボタン */}
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleCreateStripeAccount(accountType)}
                    isLoading={isProcessing}
                    loadingText={t('creating')}
                    disabled={!tosAccepted}
                    style={{
                      backgroundColor: isHovered[accountType] && tosAccepted ? '#3367D6' : '#4285FF',
                    }}
                    onMouseEnter={() => setIsHovered({ ...isHovered, [accountType]: true })}
                    onMouseLeave={() => setIsHovered({ ...isHovered, [accountType]: false })}
                  >
                    {info.buttonText}
                  </Button>
                </div>
              )
            })}

          </div>
        )}

        {/* Stripeアカウント作成済みだが本人確認未完了 */}
        {accountStatus?.hasAccount && !accountStatus.onboardingCompleted && (
          <div className="bg-white p-8 rounded-sm shadow-sm">
            <div className="flex items-start mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-4 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">
                  {t('identityVerificationRequired')}
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  {t('completeStripeVerification')}
                </p>
              </div>
            </div>

            {accountStatus.requirementsDue.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 mb-6">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  {t('missingInformation')}
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {accountStatus.requirementsDue.map((req, idx) => (
                    <li key={idx}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRefreshStatus}
              >
                {t('refreshStatus')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleCompleteOnboarding}
                isLoading={isProcessing}
                loadingText={t('preparing')}
                style={{
                  backgroundColor: isOnboardingHovered ? '#3367D6' : '#4285FF',
                }}
                onMouseEnter={() => setIsOnboardingHovered(true)}
                onMouseLeave={() => setIsOnboardingHovered(false)}
              >
                {t('completeVerification')}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Stripeアカウント完全設定済み */}
        {accountStatus?.hasAccount && accountStatus.onboardingCompleted && (
          <>
            {/* ステータスカード */}
            <div className="bg-white p-8 rounded-sm shadow-sm mb-6">
              <div className="flex items-start mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    {t('accountSetupComplete')}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {t('accountSetupCompleteDesc')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-2 ${accountStatus.chargesEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={accountStatus.chargesEnabled ? 'text-gray-700' : 'text-red-600'}>
                        {accountStatus.chargesEnabled ? t('chargesEnabled') : t('chargesDisabled')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-2 ${accountStatus.payoutsEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={accountStatus.payoutsEnabled ? 'text-gray-700' : 'text-red-600'}>
                        {accountStatus.payoutsEnabled ? t('payoutsEnabled') : t('payoutsDisabled')}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-3 h-3 rounded-full mr-2 ${userParty === 'individual' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                      <span className="text-gray-700">
                        {userParty === 'individual' ? t('individualAccount') : t('corporateAccount')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {accountStatus.requirementsDue.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 mt-4">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {t('additionalInfoRequired')}
                  </h3>
                  <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                    {accountStatus.requirementsDue.map((req, idx) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleCompleteOnboarding}
                  >
                    {t('addInformation')}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              <div className="flex items-center text-xs text-gray-500 mt-4">
                <span>{t('accountID')}{accountStatus.accountId || 'acct_xxxxxxxxx'}</span>
              </div>
            </div>

            {/* 精算情報カード */}
            {payoutInfo && (
              <div className="bg-white p-8 rounded-sm shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                  <Building2 className="w-6 h-6 mr-2 text-gray-700" />
                  {t('payoutInformation')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-xs text-gray-500 mb-1">{t('totalEarnings')}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(payoutInfo.totalEarnings)}
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <p className="text-xs text-gray-500 mb-1">{t('pending')}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(payoutInfo.pendingAmount)}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-xs text-gray-500 mb-1">{t('available')}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(payoutInfo.availableAmount)}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-sm p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('lastPayout')}</span>
                      <span className="font-medium text-gray-800">
                        {payoutInfo.lastPayoutDate || t('notYet')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('nextPayout')}</span>
                      <span className="font-medium text-gray-800">
                        {payoutInfo.nextPayoutDate || t('tbd')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRefreshStatus}
                  >
                    {t('refreshInformation')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => router.push('/transactions')}
                  >
                    {t('viewTransactionHistory')}
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    {t('platformFeeNotice')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('payoutTransferNotice')}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* TOS同意情報（デバッグ用） */}
        {accountStatus?.tosAcceptedAt && (
          <div className="mt-6 bg-gray-100 p-4 rounded-sm">
            <p className="text-xs text-gray-600">
              {t('tosAcceptedAt')}{accountStatus.tosAcceptedAt}
            </p>
            {accountStatus.tosAcceptedIp && (
              <p className="text-xs text-gray-600">
                {t('ipAddress')}{accountStatus.tosAcceptedIp}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

