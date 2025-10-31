'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BoardPost {
  id: string
  author_id: string
  author_name: string
  author_type: 'buyer' | 'seller'
  content: string
  image_url?: string
  budget?: number
  created_at: string
}

export default function BoardListPage() {
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: APIから掲示板投稿を取得
    // 仮のデータ
    const mockPosts: BoardPost[] = [
      {
        id: '1',
        author_id: 'user1',
        author_name: '山田太郎',
        author_type: 'seller',
        content: 'ECサイトを売ります。月間売上100万円。興味のある方はDMください。',
        image_url: '',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        author_id: 'user2',
        author_name: '佐藤花子',
        author_type: 'buyer',
        content: '予約管理システムを探しています。予算は300万円まで。',
        budget: 3000000,
        created_at: '2024-01-14T15:30:00Z',
      },
      {
        id: '3',
        author_id: 'user3',
        author_name: '株式会社テック',
        author_type: 'seller',
        content: '在庫管理アプリを譲渡します。ユーザー数500社以上。',
        image_url: '',
        created_at: '2024-01-14T09:15:00Z',
      },
    ]
    setPosts(mockPosts)
    setIsLoading(false)
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true
    return post.author_type === filter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '1時間以内'
    if (diffInHours < 24) return `${diffInHours}時間前`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}日前`
    return date.toLocaleDateString('ja-JP')
  }

  const formatBudget = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}千万円`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`
    return `${amount.toLocaleString()}円`
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">掲示板</h1>
            <p className="text-gray-600 mt-2">
              売り手・買い手が自由に投稿できる掲示板
            </p>
          </div>
          <Link
            href="/boards/new"
            className="bg-blue-600 text-white px-6 py-3 border-2 font-semibold hover:bg-blue-700 transition-colors"
          >
            投稿する
          </Link>
        </div>

        {/* フィルター */}
        <div className="bg-white border-2 border-gray-900 p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('seller')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'seller'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              売り手の投稿
            </button>
            <button
              onClick={() => setFilter('buyer')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'buyer'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              買い手の投稿
            </button>
          </div>
        </div>

        {/* 投稿一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/boards/${post.id}`}
                className="block bg-white border-2 border-gray-900 p-6 hover: transition-shadow"
                style={{ border: '1px solid #E9EEF2' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {post.author_type === 'seller' ? '💼' : '🛒'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {post.author_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {post.author_type === 'seller' ? '売り手' : '買い手'} • {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      post.author_type === 'seller'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {post.author_type === 'seller' ? '販売' : '購入希望'}
                  </span>
                </div>

                <p className="text-gray-800 mb-3">{post.content}</p>

                {post.budget && (
                  <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 border-2 text-sm font-medium">
                    <span>💰</span>
                    <span>予算: {formatBudget(post.budget)}</span>
                  </div>
                )}

                {post.image_url && (
                  <div className="mt-3">
                    <img
                      src={post.image_url}
                      alt="投稿画像"
                      className="border-2 w-full max-h-64 object-cover"
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {filteredPosts.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white border-2 border-gray-900">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              投稿がありません
            </h3>
            <p className="text-gray-600">
              最初の投稿者になりませんか?
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
