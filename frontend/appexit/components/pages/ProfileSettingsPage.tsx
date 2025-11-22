'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Button from '@/components/ui/Button'
import { profileApi, type Profile } from '@/lib/api-client'
import { uploadAvatarImage } from '@/lib/storage'
import { Camera } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { sanitizeText, INPUT_LIMITS } from '@/lib/input-validator'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useAvatarUrl } from '@/hooks/useAvatarUrl'

interface ProfileSettingsPageProps {
  pageDict?: any;
  locale: string;
}

export default function ProfileSettingsPage({ pageDict, locale: propLocale }: ProfileSettingsPageProps) {
  const t = useTranslations()
  const locale = propLocale || useLocale()
  const router = useRouter()
  const { user } = useAuth()
  const { loading: authLoading } = useAuthGuard()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [isHovered, setIsHovered] = useState(false)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState<number | undefined>(undefined)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // プロフィール画像のURLを自動的に変換
  const avatarUrl = useAvatarUrl(profile?.icon_url, 'avatars')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError('')

      const profile = await profileApi.getProfile()

      if (profile) {
        setProfile(profile)
        setDisplayName(profile.display_name)
        setAge(profile.age || undefined)
      } else {
        setError(t('profileNotFound'))
      }
    } catch (err) {
      setError(t('failedToLoadProfile'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('imageSizeLimit'))
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError(t('selectImageFile'))
      return
    }

    setAvatarFile(file)
    setIsUploadingAvatar(true)
    setError('')

    // プレビュー表示
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // 画像アップロード
      const publicUrl = await uploadAvatarImage(file, profile?.id)

      // プロフィールを即座に更新
      const updatedProfile = await profileApi.updateProfile({ icon_url: publicUrl })
      if (updatedProfile) {
        setProfile(prev => prev ? { ...prev, icon_url: publicUrl } : null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToUploadAvatar'))
      setAvatarFile(null)
      setAvatarPreview('')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!displayName.trim()) {
      alert(t('enterName'))
      return
    }

    // 🔒 SECURITY: 表示名をサニタイズ
    const sanitized = sanitizeText(displayName, INPUT_LIMITS.USERNAME, {
      allowHTML: false,
      strictMode: true,
    })

    if (!sanitized.isValid) {
      alert(t('invalidContent') || 'Invalid content detected. Please remove any potentially harmful code.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // プロフィール更新
      const updateData: {
        display_name?: string
        age?: number
      } = {}

      if (sanitized.sanitized !== profile?.display_name) {
        updateData.display_name = sanitized.sanitized
      }
      if (age !== profile?.age) {
        updateData.age = age
      }

      // 更新がある場合のみAPIを呼ぶ
      if (Object.keys(updateData).length > 0) {
        const updatedProfile = await profileApi.updateProfile(updateData)

        if (updatedProfile) {
          alert(t('profileUpdated'))
          // 更新されたプロフィールを再取得
          await loadProfile()
        }
      } else {
        alert(t('noChanges'))
      }
    } catch (error) {
      setError(t('failedToUpdateProfile'))
      alert(t('failedToSave'))
    } finally {
      setIsSaving(false)
    }
  }

  // 認証チェック中は何も表示しない（リダイレクト判定中）
  if (authLoading || isLoading) {
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
          <p className="text-red-600 mb-4">
            {t('profileNotFound')}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            {t('backToDashboard')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-lg text-center mb-8" style={{ color: '#323232', fontWeight: 900 }}>
          {t('common.profileSettings')}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-sm">
          {/* アバター画像 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
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
                {avatarPreview || avatarUrl ? (
                  <img
                    src={avatarPreview || avatarUrl}
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
              {!isUploadingAvatar && (
                <div className="text-sm text-gray-500">
                  {t('clickToSelectImage')}
                </div>
              )}
            </div>
          </div>

          {/* 名前 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('displayName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              required
              maxLength={INPUT_LIMITS.USERNAME}
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('displayNameHint')}
            </p>
          </div>

          {/* アカウントタイプと年齢 - 横並び */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ユーザータイプ表示 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('accountType')}
              </label>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2.5 rounded-sm font-semibold text-sm border transition-all ${
                  profile.role === 'seller'
                    ? 'bg-white text-gray-800 border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}>
                  {profile.role === 'seller' ? t('seller') : t('buyer')}
                </span>
                <span className={`px-4 py-2.5 rounded-sm font-semibold text-sm border transition-all ${
                  profile.party === 'organization'
                    ? 'bg-white text-gray-800 border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}>
                  {profile.party === 'organization' ? t('organization') : t('individual')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('accountTypeCannotChange')}
              </p>
            </div>

            {/* 年齢 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('age')}
              </label>
              <input
                type="number"
                value={age || ''}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="30"
                min="13"
                max="120"
                className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSaving}
              loadingText={t('saving')}
              style={{
                backgroundColor: isHovered ? '#D14C54' : '#E65D65',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {t('save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
