'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { postApi, type Post } from '@/lib/api-client'

export default function AppsListPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'price_low' | 'price_high' | 'popular'>('latest')
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const POSTS_PER_PAGE = 20

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async (loadMore = false) => {
    try {
      setIsLoading(true)
      setError('')
      const page = loadMore ? currentPage + 1 : 0
      const response = await postApi.getPosts({
        type: 'transaction',
        limit: POSTS_PER_PAGE,
        offset: page * POSTS_PER_PAGE,
      })

      if (loadMore) {
        setPosts(prev => [...prev, ...response])
        setCurrentPage(page)
      } else {
        setPosts(response)
        setCurrentPage(0)
      }

      setHasMore(response.length >= POSTS_PER_PAGE)
    } catch (err) {
      console.error('Failed to load posts:', err)
      setError('プロダクトの読み込みに失敗しました')
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [
    { id: 'all', name: 'すべて' },
    { id: 'ec', name: 'ECサイト' },
    { id: 'saas', name: 'SaaS' },
    { id: 'reservation', name: '予約管理' },
    { id: 'cms', name: 'CMS' },
    { id: 'crm', name: 'CRM' },
    { id: 'inventory', name: '在庫管理' },
    { id: 'other', name: 'その他' },
  ]

  // Filter posts (can be extended later with category filtering)
  const filteredPosts = posts.filter((post) => {
    // For now, show all posts since we don't have category in the schema
    return filter === 'all' || true
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return (a.price || 0) - (b.price || 0)
      case 'price_high':
        return (b.price || 0) - (a.price || 0)
      case 'popular':
        // For now, sort by created_at as a proxy for popularity
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const formatPrice = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}千万円`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`
    return `${amount.toLocaleString()}円`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">プロダクト一覧</h1>
            <p className="text-gray-600 mt-2">
              取引可能なプロダクトを検索
            </p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* フィルター・ソート */}
        <div className="bg-white border-2 border-gray-900 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* カテゴリーフィルター */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                カテゴリー
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setFilter(category.id)}
                    className={`px-4 py-2 border-2 font-medium transition-colors ${
                      filter === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ソート */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                並び替え
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">新着順</option>
                <option value="price_low">価格が安い順</option>
                <option value="price_high">価格が高い順</option>
                <option value="popular">人気順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 検索結果数 */}
        <div className="mb-4 text-gray-600">
          {sortedPosts.length}件のプロダクトが見つかりました
        </div>

        {/* プロダクト一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPosts.map((post) => (
            <Link key={post.id} href={`/projects/${post.id}`}>
              <div className="bg-white border-2 border-gray-900 hover:shadow-lg transition-shadow h-full">
                {/* 画像 */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">📱</span>
                  )}
                </div>

                <div className="p-6">
                  {/* タイプバッジ */}
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium mb-3">
                    {post.type === 'transaction' ? '取引投稿' : post.type === 'secret' ? 'シークレット' : '掲示板'}
                  </span>

                  {/* タイトル */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {post.title}
                  </h3>

                  {/* 説明 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.body || '説明がありません'}
                  </p>

                  {/* 予算範囲 */}
                  {(post.budget_min || post.budget_max) && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                      <span>💰</span>
                      <span>予算: {formatPrice(post.budget_min || 0)} - {formatPrice(post.budget_max || 0)}</span>
                    </div>
                  )}

                  {/* 価格 */}
                  {post.price && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(post.price)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {sortedPosts.length === 0 && (
          <div className="text-center py-12 bg-white border-2 border-gray-900">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              プロダクトが見つかりませんでした
            </h3>
            <p className="text-gray-600">
              別のカテゴリーで検索してみてください
            </p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !isLoading && sortedPosts.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => loadPosts(true)}
              className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              もっと読み込む
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
