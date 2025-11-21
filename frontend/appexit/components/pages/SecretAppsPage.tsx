'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { postApi, Post } from '@/lib/api-client'

interface SecretApp {
  id: string
  title?: string
  price: number
  category?: string
  nda_required: boolean
  has_access: boolean
  seller_name?: string
}

export default function SecretAppsPage() {
  const [apps, setApps] = useState<SecretApp[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSecretPosts = async () => {
      try {
        setIsLoading(true)
        // APIからシークレット投稿を取得
        const posts = await postApi.getPosts({
          post_types: ['secret'],
          limit: 100,
        })

        // Post型をSecretApp型に変換
        const secretApps: SecretApp[] = posts.map((post: Post) => {
          // タイトルが空の場合はNDA未締結と判断
          const hasAccess = post.title !== '' && post.title != null
          
          return {
            id: post.id,
            title: hasAccess ? post.title : undefined,
            price: post.price || 0,
            category: post.app_categories?.[0] || undefined,
            nda_required: true,
            has_access: hasAccess,
            seller_name: post.author_profile?.display_name || undefined,
          }
        })

        setApps(secretApps)
      } catch (error) {
        console.error('Failed to fetch secret posts:', error)
        setApps([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecretPosts()
  }, [])

  const formatPrice = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}千万円`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`
    return `${amount.toLocaleString()}円`
  }

  const handleRequestNDA = (appId: string) => {
    // TODO: NDA締結リクエスト送信
    // NDA agreement request
    alert('NDA締結リクエストを送信しました')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">シークレット投稿</h1>
          <p className="text-gray-600 mt-2">
            NDA締結後に詳細が閲覧できる非公開案件
          </p>
        </div>

        {/* 注意事項 */}
        <div className="bg-purple-50 border border-purple-200 border-2 p-6 mb-8">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">
                シークレット投稿について
              </h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 詳細情報はNDA締結後に閲覧可能です</li>
                <li>• 価格のみ公開されています</li>
                <li>• NDA締結にはオンライン署名が必要です</li>
                <li>• 守秘義務違反には法的責任が伴います</li>
              </ul>
            </div>
          </div>
        </div>

        {/* プロダクト一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin  h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div
                key={app.id}
                className="bg-white border-2 border-purple-200 hover: transition-shadow"
              >
                {/* ヘッダー */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 ">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">🔒</span>
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-medium ">
                      シークレット
                    </span>
                  </div>
                  {app.has_access ? (
                    <h3 className="text-xl font-bold text-gray-900">
                      {app.title}
                    </h3>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* アクセス権がある場合 */}
                  {app.has_access ? (
                    <>
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm mb-2">
                          カテゴリー: {app.category || '未分類'}
                        </p>
                        <p className="text-gray-600 text-sm">
                          売り手: {app.seller_name}
                        </p>
                      </div>

                      <div className="mb-4 pt-4 border-t border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatPrice(app.price)}
                        </div>
                      </div>

                      <Link
                        href={`/projects/${app.id}`}
                        className="block w-full bg-purple-600 text-white text-center px-6 py-3 border-2 font-semibold hover:bg-purple-700 transition-colors"
                      >
                        詳細を見る
                      </Link>
                    </>
                  ) : (
                    /* アクセス権がない場合 */
                    <>
                      <div className="mb-6 text-center">
                        <div className="text-6xl mb-3">🔐</div>
                        <p className="text-gray-600 text-sm mb-2">
                          詳細を閲覧するには
                        </p>
                        <p className="text-gray-900 font-semibold">
                          NDA締結が必要です
                        </p>
                      </div>

                      <div className="mb-4 pt-4 border-t border-gray-200">
                        <div className="text-center mb-2">
                          <span className="text-sm text-gray-600">価格</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 text-center">
                          {formatPrice(app.price)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRequestNDA(app.id)}
                        className="w-full bg-purple-600 text-white px-6 py-3 border-2 font-semibold hover:bg-purple-700 transition-colors"
                      >
                        NDA締結をリクエスト
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {apps.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white border-2 border-gray-900">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              シークレット投稿はありません
            </h3>
            <p className="text-gray-600">
              現在、閲覧可能なシークレット投稿がありません
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
