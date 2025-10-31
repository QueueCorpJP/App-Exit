'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BoardPost {
  id: string
  author_user_id: string
  author_name: string
  author_type: 'buyer' | 'seller'
  content: string
  image_url?: string
  budget?: number
  created_at: string
}

interface BoardDetailPageProps {
  postId: string
}

export default function BoardDetailPage({ postId }: BoardDetailPageProps) {
  const [post, setPost] = useState<BoardPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // TODO: APIから掲示板投稿を取得
    // 仮のデータ
    const mockPost: BoardPost = {
      id: postId,
      author_user_id: 'user1',
      author_name: '山田太郎',
      author_type: 'seller',
      content: 'ECサイトを売ります。月間売上100万円。興味のある方はDMください。詳細はお問い合わせください。',
      image_url: '',
      created_at: '2024-01-15T10:00:00Z',
    }
    setPost(mockPost)
    setIsLoading(false)
  }, [postId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatBudget = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}千万円`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`
    return `${amount.toLocaleString()}円`
  }

  const handleSendMessage = () => {
    if (post) {
      router.push(`/messages/${post.author_user_id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">投稿が見つかりません</h2>
          <Link href="/boards" className="text-blue-600 hover:text-blue-700">
            掲示板一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 戻るボタン */}
        <Link
          href="/boards"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <span className="mr-2">←</span>
          掲示板一覧に戻る
        </Link>

        {/* メインコンテンツ */}
        <div className="bg-white border-2 border-gray-900 p-8">
          {/* 投稿者情報 */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-3xl">
                  {post.author_type === 'seller' ? '💼' : '🛒'}
                </span>
              </div>
              <div>
                <Link
                  href={`/profile/${post.author_user_id}`}
                  className="font-bold text-xl text-gray-900 hover:text-blue-600"
                >
                  {post.author_name}
                </Link>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.author_type === 'seller'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {post.author_type === 'seller' ? '売り手' : '買い手'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-6 py-3 border-2 font-semibold hover:bg-blue-700 transition-colors"
            >
              メッセージを送る
            </button>
          </div>

          {/* 投稿内容 */}
          <div className="mb-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* 予算表示 */}
          {post.budget && (
            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 border-2 font-medium">
                <span className="text-xl">💰</span>
                <span>予算: {formatBudget(post.budget)}</span>
              </div>
            </div>
          )}

          {/* 画像 */}
          {post.image_url && (
            <div className="mb-6">
              <img
                src={post.image_url}
                alt="投稿画像"
                className="border-2 w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* アクション */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSendMessage}
                className="flex-1 bg-blue-600 text-white px-6 py-3 border-2 font-semibold hover:bg-blue-700 transition-colors"
              >
                この投稿者にコンタクトする
              </button>
              <Link
                href={`/profile/${post.author_user_id}`}
                className="px-6 py-3 border-2 font-semibold text-gray-700 border-2 border-gray-300 hover:border-gray-400 transition-colors"
              >
                プロフィールを見る
              </Link>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 border-2 p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                取引時の注意事項
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 取引は必ずプラットフォーム内で行ってください</li>
                <li>• 直接の金銭授受は禁止されています</li>
                <li>• 不審な取引を発見した場合は運営にご報告ください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
