'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

export default function UserTypeSelectionPage() {
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null)
  const [party, setParty] = useState<'organization' | 'individual' | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)

    if (!role || !party) {
      setError('すべての必須項目を選択してください')
      return
    }

    const formData = new FormData(e.currentTarget)
    const displayName = formData.get('display_name') as string
    const age = formData.get('age') as string

    if (!displayName) {
      setError('表示名を入力してください')
      return
    }

    setIsPending(true)

    try {
      console.log('[PROFILE] Creating profile...')
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

      // Supabaseセッションからトークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        setIsPending(false)
        return
      }

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
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      })

      const result = await response.json()
      console.log('[PROFILE] Response:', result)

      if (!response.ok) {
        setError(result.error || 'プロフィール作成に失敗しました')
        setIsPending(false)
        return
      }

      // user_info Cookieを更新
      const userInfoCookie = getCookie('user_info')
      if (userInfoCookie) {
        try {
          const userInfo = JSON.parse(decodeURIComponent(userInfoCookie))
          userInfo.profile = result.data
          document.cookie = `user_info=${encodeURIComponent(JSON.stringify(userInfo))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        } catch (e) {
          console.error('Failed to update user_info cookie:', e)
        }
      }

      // ホームページにリダイレクト
      console.log('[PROFILE] Redirecting to home...')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Profile creation error:', error)
      setError('プロフィール作成中にエラーが発生しました')
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F9F8F7' }}>
      <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900 p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          プロフィール設定
        </h1>
        <p className="text-center text-gray-600 mb-8">
          あなたの情報を入力してください
        </p>

        {/* ユーザータイプ選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. あなたは買い手ですか? それとも売り手ですか?
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
              <div className="font-semibold text-lg">買い手</div>
              <div className="text-sm text-gray-600 mt-1">
                アプリを購入したい
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
              <div className="font-semibold text-lg">売り手</div>
              <div className="text-sm text-gray-600 mt-1">
                アプリを販売したい
              </div>
            </button>
          </div>
        </div>

        {/* エンティティタイプ選択 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. 法人ですか? それとも個人ですか?
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
              <div className="font-semibold text-lg">法人</div>
              <div className="text-sm text-gray-600 mt-1">
                会社として利用
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
              <div className="font-semibold text-lg">個人</div>
              <div className="text-sm text-gray-600 mt-1">
                個人として利用
              </div>
            </button>
          </div>
        </div>

        {/* 表示名入力 */}
        <div className="mb-6">
          <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
            3. 表示名 <span className="text-red-500">*</span>
          </label>
          <input
            id="display_name"
            name="display_name"
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900"
            placeholder="山田太郎"
            required
          />
        </div>

        {/* 年齢入力 */}
        <div className="mb-6">
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            4. 年齢（任意）
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min="13"
            max="120"
            className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900"
            placeholder="25"
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
          loadingText="プロフィール作成中..."
        >
          完了
        </Button>
      </form>
    </div>
  )
}
