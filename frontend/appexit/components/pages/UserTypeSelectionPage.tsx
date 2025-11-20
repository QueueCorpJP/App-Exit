'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Button from '@/components/ui/Button'

interface UserTypeSelectionPageProps {
  pageDict?: Record<string, any>;
}

export default function UserTypeSelectionPage({ pageDict }: UserTypeSelectionPageProps = {}) {
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null)
  const [party, setParty] = useState<'organization' | 'individual' | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)

    if (!role || !party) {
      setError(t('userTypeSelectAll'))
      return
    }

    const formData = new FormData(e.currentTarget)
    const displayName = formData.get('display_name') as string
    const age = formData.get('age') as string

    if (!displayName) {
      setError(t('userTypeEnterName'))
      return
    }

    setIsPending(true)

    try {
      // Creating profile
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

      // Cookie認証（トークンは不要、バックエンドがCookieを確認）
      const profileData: any = {
        role,
        party,
        display_name: displayName,
      }

      if (age) {
        const ageNum = parseInt(age, 10)
        if (!isNaN(ageNum)) {
          profileData.age = ageNum
        }
      }

      const response = await fetch(`${API_URL}/api/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // HttpOnly Cookieを自動送信
        body: JSON.stringify(profileData),
      })

      const result = await response.json()
      // Profile created successfully

      if (!response.ok) {
        setError(result.error || t('userTypeCreateFailed'))
        setIsPending(false)
        return
      }

      // ホームページにリダイレクト
      // Redirecting to home
      router.push('/')
      router.refresh()
    } catch (error) {
      // Profile creation error - handle error
      setError(t('userTypeCreateError'))
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F9F8F7' }}>
      <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900 p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {t('userTypeTitle')}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t('userTypeSubtitle')}
        </p>

        {/* ユーザータイプ選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('userTypeQuestion1')}
          </h2>
          <input type="hidden" name="role" value={role || ''} />
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`p-6 border-2 transition-all duration-200 ${
                role === 'buyer'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
            >
              <div className="text-4xl mb-2">🛒</div>
              <div className="font-semibold text-lg">
                {t('buyer')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t('userTypeBuyerDesc')}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('seller')}
              className={`p-6 border-2 transition-all duration-200 ${
                role === 'seller'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              <div className="text-4xl mb-2">💼</div>
              <div className="font-semibold text-lg">
                {t('seller')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t('userTypeSellerDesc')}
              </div>
            </button>
          </div>
        </div>

        {/* エンティティタイプ選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('userTypeQuestion2')}
          </h2>
          <input type="hidden" name="party" value={party || ''} />
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setParty('organization')}
              className={`p-6 border-2 transition-all duration-200 ${
                party === 'organization'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-500'
              }`}
            >
              <div className="text-4xl mb-2">🏢</div>
              <div className="font-semibold text-lg">
                {t('organization')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t('userTypeOrgDesc')}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setParty('individual')}
              className={`p-6 border-2 transition-all duration-200 ${
                party === 'individual'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-500'
              }`}
            >
              <div className="text-4xl mb-2">👤</div>
              <div className="font-semibold text-lg">
                {t('individual')}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t('userTypeIndDesc')}
              </div>
            </button>
          </div>
        </div>

        {/* 表示名入力 */}
        <div className="mb-6">
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('userTypeDisplayName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900"
            placeholder={t('displayNamePlaceholder')}
            required
          />
        </div>

        {/* 年齢入力 */}
        <div className="mb-6">
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            {t('userTypeAge')}
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min="13"
            max="120"
            className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900"
            placeholder={t('userTypeAgePlaceholder')}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* 送信ボタン */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!role || !party || isPending}
          isLoading={isPending}
          loadingText={t('userTypeCreating')}
        >
          {t('completed')}
        </Button>
      </form>
    </div>
  )
}
