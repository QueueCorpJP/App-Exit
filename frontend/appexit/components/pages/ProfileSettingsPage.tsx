'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { profileApi, type Profile, postApi, type Post } from '@/lib/api-client'
import { uploadAvatarImage } from '@/lib/storage'
import { Camera, CreditCard, CheckCircle2 } from 'lucide-react'
import ProjectCard from '@/components/ui/ProjectCard'
import { useAuth } from '@/lib/auth-context'

type TabType = 'profile' | 'watching' | 'myposts';

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
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

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [watchingPosts, setWatchingPosts] = useState<Post[]>([])
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [hasMoreWatching, setHasMoreWatching] = useState(true)
  const [hasMoreMyPosts, setHasMoreMyPosts] = useState(true)
  const [watchingOffset, setWatchingOffset] = useState(0)
  const [myPostsOffset, setMyPostsOffset] = useState(0)
  const POSTS_PER_PAGE = 12

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (user?.id && activeTab === 'watching') {
      console.log('[ProfileSettings] User ID detected, loading watching posts:', user.id)
      loadWatchingPosts()
    } else if (user?.id && activeTab === 'myposts') {
      console.log('[ProfileSettings] User ID detected, loading my posts:', user.id)
      loadMyPosts()
    }
  }, [user?.id, activeTab])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError('')

      const profile = await profileApi.getProfile()

      if (profile) {
        console.log('[ProfileSettings] Loaded profile:', profile)
        console.log('[ProfileSettings] stripe_account_id:', profile.stripe_account_id)
        console.log('[ProfileSettings] stripe_onboarding_completed:', profile.stripe_onboarding_completed)
        setProfile(profile)
        setDisplayName(profile.display_name)
        setAge(profile.age || undefined)
        setAvatarPreview(profile.icon_url || '')
      } else {
        setError('プロフィールが見つかりません')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('プロフィールの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWatchingPosts = async (loadMore = false) => {
    if (!user?.id) {
      console.log('[ProfileSettings] No user ID, skipping posts load')
      return
    }

    try {
      console.log('[ProfileSettings] Loading active views for user:', user.id)
      setIsLoadingPosts(true)

      const offset = loadMore ? watchingOffset : 0
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      // ページネーション付きでアクティブビューを取得
      const { data: activeViews, error: activeViewError } = await supabase
        .from('product_active_views')
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1)

      if (activeViewError) {
        console.error('[ProfileSettings] Failed to load active views:', activeViewError)
        if (!loadMore) setWatchingPosts([])
        return
      }

      console.log('[ProfileSettings] Active views:', activeViews)

      if (!activeViews || activeViews.length === 0) {
        console.log('[ProfileSettings] No more active views found')
        setHasMoreWatching(false)
        if (!loadMore) setWatchingPosts([])
        return
      }

      // これ以上データがないかチェック
      if (activeViews.length < POSTS_PER_PAGE) {
        setHasMoreWatching(false)
      }

      // アクティブビューの投稿IDを取得
      const postIds = activeViews.map(av => av.post_id)
      console.log('[ProfileSettings] Post IDs from active views:', postIds)

      // 投稿の詳細を一括取得（N+1問題を回避、必要なフィールドのみ取得）
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          category,
          image_url,
          image_path,
          desired_price,
          monthly_revenue,
          monthly_cost,
          profit_margin,
          status,
          updated_at,
          active_view_count
        `)
        .in('id', postIds)

      if (postsError) {
        console.error('[ProfileSettings] Failed to load posts:', postsError)
        if (!loadMore) setWatchingPosts([])
        return
      }

      console.log('[ProfileSettings] Loaded watching posts:', posts)

      if (loadMore) {
        setWatchingPosts(prev => [...prev, ...(posts || [])])
        setWatchingOffset(offset + POSTS_PER_PAGE)
      } else {
        setWatchingPosts(posts || [])
        setWatchingOffset(POSTS_PER_PAGE)
      }
    } catch (err) {
      console.error('[ProfileSettings] Failed to load watched posts:', err)
      if (!loadMore) setWatchingPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const loadMyPosts = async (loadMore = false) => {
    if (!user?.id) {
      console.log('[ProfileSettings] No user ID, skipping my posts load')
      return
    }

    try {
      console.log('[ProfileSettings] Loading my posts for user:', user.id)
      setIsLoadingPosts(true)

      const offset = loadMore ? myPostsOffset : 0
      const posts = await postApi.getPosts({
        author_user_id: user.id,
        limit: POSTS_PER_PAGE,
        offset: offset
      })

      console.log('[ProfileSettings] Loaded my posts:', posts)

      // これ以上データがないかチェック
      if (!posts || posts.length < POSTS_PER_PAGE) {
        setHasMoreMyPosts(false)
      }

      if (loadMore) {
        setMyPosts(prev => [...prev, ...(posts || [])])
        setMyPostsOffset(offset + POSTS_PER_PAGE)
      } else {
        setMyPosts(posts || [])
        setMyPostsOffset(POSTS_PER_PAGE)
      }
    } catch (err) {
      console.error('[ProfileSettings] Failed to load my posts:', err)
      if (!loadMore) setMyPosts([])
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('画像サイズは5MB以下にしてください')
      return
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
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
      console.log('Avatar uploaded successfully:', publicUrl)

      // プロフィールを即座に更新
      const updatedProfile = await profileApi.updateProfile({ icon_url: publicUrl })
      if (updatedProfile) {
        setProfile(prev => prev ? { ...prev, icon_url: publicUrl } : null)
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      setError(err instanceof Error ? err.message : 'アバター画像のアップロードに失敗しました')
      setAvatarFile(null)
      setAvatarPreview(profile?.icon_url || '')
    } finally {
      setIsUploadingAvatar(false)
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
      } = {}

      if (displayName !== profile?.display_name) {
        updateData.display_name = displayName
      }
      if (age !== profile?.age) {
        updateData.age = age
      }

      // 更新がある場合のみAPIを呼ぶ
      if (Object.keys(updateData).length > 0) {
        const updatedProfile = await profileApi.updateProfile(updateData)

        if (updatedProfile) {
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

  const displayPosts = activeTab === 'watching' ? watchingPosts : myPosts;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-lg text-center mb-8" style={{ color: '#323232', fontWeight: 900 }}>
          プロフィール
        </h1>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 bg-white rounded-t-sm mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            プロフィール設定
          </button>
          <button
            onClick={() => setActiveTab('watching')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'watching'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ウォッチ中 ({watchingPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('myposts')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'myposts'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            投稿 ({myPosts.length})
          </button>
        </div>

        {/* プロフィール設定タブ */}
        {activeTab === 'profile' && (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-sm">
          {/* アバター画像 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              アイコン画像
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
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="アイコンプレビュー"
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
                <span className="text-sm text-gray-600">アップロード中...</span>
              )}
              {!isUploadingAvatar && (
                <div className="text-sm text-gray-500">
                  クリックして画像を選択
                </div>
              )}
            </div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              本名またはハンドルネーム
            </p>
          </div>

          {/* アカウントタイプと年齢 - 横並び */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ユーザータイプ表示 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                アカウントタイプ
              </label>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2.5 rounded-sm font-semibold text-sm border transition-all ${
                  profile.role === 'seller'
                    ? 'bg-white text-gray-800 border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}>
                  {profile.role === 'seller' ? '売り手' : '買い手'}
                </span>
                <span className={`px-4 py-2.5 rounded-sm font-semibold text-sm border transition-all ${
                  profile.party === 'organization'
                    ? 'bg-white text-gray-800 border-gray-800'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}>
                  {profile.party === 'organization' ? '法人' : '個人'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                アカウントタイプは変更できません
              </p>
            </div>

            {/* 年齢 */}
            <div>
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
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSaving}
              loadingText="保存中..."
              style={{
                backgroundColor: isHovered ? '#D14C54' : '#E65D65',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              保存する
            </Button>
          </div>
        </form>

        {/* 決済設定カード（売り手・仲介のみ表示） */}
        {(profile.role === 'seller' || profile.role === 'advisor' || profile.roles?.includes('seller') || profile.roles?.includes('advisor')) && (
          <div className="bg-white p-8 rounded-sm mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {profile.stripe_account_id && profile.stripe_onboarding_completed ? (
                  <>
                    <div className="relative w-16 h-16">
                      {/* グラデーション背景 */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 shadow-lg"></div>

                      {/* パルスアニメーション */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 animate-pulse opacity-75"></div>

                      {/* Stripeアイコン（クレジットカード） */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>

                      {/* チェックマークバッジ */}
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-green-500">
                        <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                      </div>

                      {/* 光沢エフェクト */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent"></div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 flex items-center">
                        決済登録完了
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          認証済み
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Stripe決済アカウントが登録されています
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                          本人確認完了
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                          売上受取可能
                        </div>
                      </div>
                    </div>
                  </>
                ) : profile.stripe_account_id ? (
                  <>
                    <div className="relative w-16 h-16">
                      {/* グラデーション背景 */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-lg"></div>

                      {/* Stripeアイコン（クレジットカード） */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>

                      {/* 警告バッジ */}
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-yellow-500">
                        <span className="text-yellow-600 font-bold text-sm">!</span>
                      </div>

                      {/* 光沢エフェクト */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent"></div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 flex items-center">
                        本人確認が必要です
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
                          要確認
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Stripeの本人確認を完了してください
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        ⚠️ 本人確認が完了するまで売上の受取はできません
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-16 h-16">
                      {/* グラデーション背景 */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-lg"></div>

                      {/* Stripeアイコン（クレジットカード） */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-white" strokeWidth={2} />
                      </div>

                      {/* プラスバッジ */}
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-blue-500">
                        <span className="text-blue-600 font-bold text-lg leading-none">+</span>
                      </div>

                      {/* 光沢エフェクト */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent"></div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-800 flex items-center">
                        決済設定
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                          未設定
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        売上を受け取るにはStripe決済の設定が必要です
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        💡 数分で簡単に設定できます
                      </p>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant={profile.stripe_account_id && profile.stripe_onboarding_completed ? "outline" : "primary"}
                onClick={() => router.push('/settings/payment')}
              >
                {profile.stripe_account_id && profile.stripe_onboarding_completed ? '設定を確認' : profile.stripe_account_id ? '本人確認を完了' : '設定を開始'}
              </Button>
            </div>
          </div>
        )}
          </>
        )}

        {/* ウォッチ中/投稿タブ */}
        {(activeTab === 'watching' || activeTab === 'myposts') && (
          <div>
            {displayPosts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayPosts.map((post) => (
                    <ProjectCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      category={post.category || ''}
                      image={post.image_url || ''}
                      imagePath={post.image_path || null}
                      price={post.desired_price || 0}
                      monthlyRevenue={post.monthly_revenue}
                      monthlyCost={post.monthly_cost}
                      profitMargin={post.profit_margin}
                      status={post.status}
                      updatedAt={post.updated_at}
                      authorProfile={post.author_profile}
                      activeViewCount={post.active_view_count}
                    />
                  ))}
                </div>

                {/* もっと読み込むボタン */}
                {((activeTab === 'watching' && hasMoreWatching) || (activeTab === 'myposts' && hasMoreMyPosts)) && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => {
                        if (activeTab === 'watching') {
                          loadWatchingPosts(true)
                        } else {
                          loadMyPosts(true)
                        }
                      }}
                      disabled={isLoadingPosts}
                      variant="outline"
                      className="px-8"
                    >
                      {isLoadingPosts ? '読み込み中...' : 'もっと読み込む'}
                    </Button>
                  </div>
                )}
              </>
            )}

            {isLoadingPosts && displayPosts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <p className="ml-3 text-gray-600">読み込み中...</p>
              </div>
            )}

            {!isLoadingPosts && displayPosts.length === 0 && (
              <div className="bg-white p-8 rounded-sm text-center">
                <p className="text-gray-500">
                  {activeTab === 'watching'
                    ? 'まだプロダクトをウォッチしていません'
                    : 'まだプロダクトを投稿していません'}
                </p>
                <Button
                  onClick={() => router.push(activeTab === 'watching' ? '/' : '/projects/new')}
                  className="mt-4"
                  style={{
                    backgroundColor: '#E65D65',
                    color: '#fff'
                  }}
                >
                  {activeTab === 'watching' ? 'プロダクトを探す' : 'プロダクトを投稿する'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
