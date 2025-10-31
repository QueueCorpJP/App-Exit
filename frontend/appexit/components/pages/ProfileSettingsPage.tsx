'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { profileApi, type Profile } from '@/lib/api-client'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>('')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState<number | undefined>(undefined)
  const [iconUrl, setIconUrl] = useState('')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError('')

      const response = await profileApi.getProfile()

      if (response.success && response.data) {
        setProfile(response.data)
        setDisplayName(response.data.display_name)
        setAge(response.data.age || undefined)
        setIconUrl(response.data.icon_url || '')
        setAvatarPreview(response.data.icon_url || '')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('プロフィールの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!displayName.trim()) {
      alert('名前を入力してください')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // プロフィール更新
      const updateData: {
        display_name?: string
        age?: number
        icon_url?: string
      } = {}

      if (displayName !== profile?.display_name) {
        updateData.display_name = displayName
      }
      if (age !== profile?.age) {
        updateData.age = age
      }
      if (iconUrl !== profile?.icon_url) {
        updateData.icon_url = iconUrl || undefined
      }

      // TODO: 画像アップロード機能（将来的に実装）
      if (avatarFile) {
        console.log('アバター画像アップロードは今後実装予定:', avatarFile)
      }

      // 更新がある場合のみAPIを呼ぶ
      if (Object.keys(updateData).length > 0) {
        const response = await profileApi.updateProfile(updateData)

        if (response.success) {
          alert('プロフィールを更新しました')
          // 更新されたプロフィールを再取得
          await loadProfile()
        }
      } else {
        alert('変更がありません')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      setError('プロフィールの更新に失敗しました')
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <p className="text-red-600 mb-4">プロフィールが見つかりません</p>
          <Button onClick={() => router.push('/dashboard')}>
            ダッシュボードに戻る
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          プロフィール設定
        </h1>
        <p className="text-gray-600 mb-8">
          あなたの基本情報を更新できます
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow">
          {/* アバター画像 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="プロフィール"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>
              <div>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => {
                    setIconUrl(e.target.value)
                    setAvatarPreview(e.target.value)
                  }}
                  placeholder="画像URL（例: https://example.com/avatar.jpg）"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  画像のURLを入力してください
                </p>
              </div>
            </div>
          </div>

          {/* ユーザータイプ表示 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              アカウントタイプ
            </label>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded font-medium ${
                profile.role === 'seller'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {profile.role === 'seller' ? '売り手' : '買い手'}
              </span>
              <span className={`px-4 py-2 rounded font-medium ${
                profile.party === 'organization'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {profile.party === 'organization' ? '法人' : '個人'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              アカウントタイプは変更できません
            </p>
          </div>

          {/* 名前 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田太郎"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              本名またはハンドルネーム
            </p>
          </div>

          {/* 年齢 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              年齢
            </label>
            <input
              type="number"
              value={age || ''}
              onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="30"
              min="13"
              max="120"
              className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 保存ボタン */}
          <div className="flex space-x-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSaving}
              loadingText="保存中..."
            >
              保存する
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
