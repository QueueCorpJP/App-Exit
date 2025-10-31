'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { messageApi, ThreadWithLastMessage, ThreadDetail } from '@/lib/api-client'

export default function MessagesListPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadWithLastMessage[]>([])
  const [threadDetails, setThreadDetails] = useState<Map<string, ThreadDetail>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchThreads = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await messageApi.getThreads()
        if (response.success && response.data) {
          setThreads(response.data)
          
          // 各スレッドの詳細を並行取得（N+1問題の解決）
          const threadDetailsPromises = response.data.map(async (thread) => {
            try {
              const detailResponse = await messageApi.getThread(thread.id)
              if (detailResponse.success && detailResponse.data) {
                return { threadId: thread.id, detail: detailResponse.data } as const
              }
              return null
            } catch (err) {
              console.error(`Failed to fetch thread detail for ${thread.id}:`, err)
              return null
            }
          })

          // すべてのスレッド詳細を並行で取得
          const detailsResults = await Promise.all(threadDetailsPromises)
          const detailsMap = new Map<string, ThreadDetail>()
          
          for (const result of detailsResults) {
            if (result) {
              detailsMap.set(result.threadId, result.detail)
            }
          }
          
          setThreadDetails(detailsMap)
        }
      } catch (err) {
        console.error('Failed to fetch threads:', err)
        setError('スレッドの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchThreads()
  }, [user])

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}時間前`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}日前`

    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  }

  const getOtherParticipant = (thread: ThreadWithLastMessage) => {
    if (!user) return null
    const detail = threadDetails.get(thread.id)
    if (!detail) return null
    return detail.participants.find(p => p.id !== user.id)
  }

  const totalUnread = threads.reduce((sum, thread) => sum + thread.unread_count, 0)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ログインが必要です</h1>
          <Link href="/login" className="text-blue-600 hover:underline">
            ログインページへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">メッセージ</h1>
          <p className="text-gray-600 mt-2">
            {totalUnread > 0 ? `${totalUnread}件の未読メッセージがあります` : 'すべて既読です'}
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 border-2 p-4 rounded">
            <p className="text-sm text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-xs text-red-600 hover:underline"
            >
              閉じる
            </button>
          </div>
        )}

        {/* メッセージ一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-900">
            {threads.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {threads.map((thread) => {
                  const otherParticipant = getOtherParticipant(thread)
                  const lastMessageText = thread.last_message?.text || 'メッセージがありません'
                  const lastMessageTime = thread.last_message?.created_at || thread.created_at

                  return (
                    <Link
                      key={thread.id}
                      href={`/messages/${thread.id}`}
                      className="block hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* アバター */}
                          <Link
                            href={`/profile/${otherParticipant?.id || thread.participant_ids.find(id => id !== user.id) || ''}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          >
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                              {otherParticipant?.icon_url ? (
                                <img 
                                  src={otherParticipant.icon_url} 
                                  alt={otherParticipant.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">
                                  {otherParticipant?.role === 'seller' ? '💼' : '🛒'}
                                </span>
                              )}
                            </div>
                          </Link>

                          {/* メッセージ内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/profile/${otherParticipant?.id || thread.participant_ids.find(id => id !== user.id) || ''}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-lg font-semibold text-gray-900 hover:underline"
                                >
                                  {otherParticipant?.display_name || '不明なユーザー'}
                                </Link>
                                {otherParticipant && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      otherParticipant.role === 'seller'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {otherParticipant.role === 'seller' ? '売り手' : '買い手'}
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatTime(lastMessageTime)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <p className="text-gray-600 text-sm truncate pr-4">
                                {lastMessageText}
                              </p>
                              {thread.unread_count > 0 && (
                                <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                  {thread.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  メッセージがありません
                </h3>
                <p className="text-gray-600 mb-6">
                  興味のあるアプリについて問い合わせてみましょう
                </p>
                <Link
                  href="/apps"
                  className="inline-block bg-blue-600 text-white px-6 py-3 border-2 font-semibold hover:bg-blue-700 transition-colors"
                >
                  アプリを探す
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 border-2 p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">
                メッセージ機能について
              </h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• すべてのメッセージは削除できません（取引の証拠として保管）</li>
                <li>• 不適切なメッセージを受信した場合は運営に報告してください</li>
                <li>• プラットフォーム外での取引は禁止されています</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
