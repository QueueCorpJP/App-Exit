'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Transaction {
  id: string
  app_id: string
  app_title: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  buyer_name?: string
  seller_name?: string
  created_at: string
  completed_at?: string
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState<'buyer' | 'seller' | null>(null)

  useEffect(() => {
    // LocalStorageからユーザータイプを取得
    const storedUserType = localStorage.getItem('userType') as 'buyer' | 'seller'
    setUserType(storedUserType)

    // TODO: APIから取引履歴を取得
    // 仮のデータ
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        app_id: 'app1',
        app_title: 'ECサイトプロダクト',
        amount: 5000000,
        status: 'completed',
        buyer_name: '佐藤花子',
        seller_name: '山田太郎',
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:05:00Z',
      },
      {
        id: '2',
        app_id: 'app2',
        app_title: '予約管理システム',
        amount: 3000000,
        status: 'pending',
        buyer_name: '田中一郎',
        seller_name: '鈴木次郎',
        created_at: '2024-01-14T15:30:00Z',
      },
      {
        id: '3',
        app_id: 'app3',
        app_title: '在庫管理プロダクト',
        amount: 2000000,
        status: 'completed',
        buyer_name: '高橋三郎',
        seller_name: '伊藤四郎',
        created_at: '2024-01-10T09:20:00Z',
        completed_at: '2024-01-10T09:25:00Z',
      },
    ]
    setTransactions(mockTransactions)
    setIsLoading(false)
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    if (filter === 'all') return true
    return transaction.status === filter
  })

  const formatPrice = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(0)}千万円`
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万円`
    return `${amount.toLocaleString()}円`
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            ✓ 完了
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            ⏳ 処理中
          </span>
        )
      case 'failed':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
            ✗ 失敗
          </span>
        )
      case 'refunded':
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
            ↩ 返金済み
          </span>
        )
      default:
        return null
    }
  }

  const totalAmount = filteredTransactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">取引履歴</h1>
          <p className="text-gray-600 mt-2">
            {userType === 'seller' ? '販売履歴' : '購入履歴'}を確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 p-6 border-gray-900">
            <div className="text-sm text-gray-600 mb-1">総取引数</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredTransactions.length}件
            </div>
          </div>
          <div className="bg-white border-2 p-6 border-gray-900">
            <div className="text-sm text-gray-600 mb-1">完了した取引</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredTransactions.filter((t) => t.status === 'completed').length}件
            </div>
          </div>
          <div className="bg-white border-2 p-6 border-gray-900">
            <div className="text-sm text-gray-600 mb-1">処理中</div>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredTransactions.filter((t) => t.status === 'pending').length}件
            </div>
          </div>
          <div className="bg-white border-2 p-6 border-gray-900">
            <div className="text-sm text-gray-600 mb-1">総取引額</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(totalAmount)}
            </div>
          </div>
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
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              完了
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              処理中
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 border-2 font-medium transition-colors ${
                filter === 'failed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              失敗
            </button>
          </div>
        </div>

        {/* 取引履歴一覧 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white border-2 border-gray-900">
            {filteredTransactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-blue-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            href={`/projects/${transaction.app_id}`}
                            className="text-lg font-bold text-gray-900 hover:text-blue-600"
                          >
                            {transaction.app_title}
                          </Link>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {userType === 'buyer' && transaction.seller_name && (
                            <div>売り手: {transaction.seller_name}</div>
                          )}
                          {userType === 'seller' && transaction.buyer_name && (
                            <div>買い手: {transaction.buyer_name}</div>
                          )}
                          <div>取引ID: {transaction.id}</div>
                          <div>作成日時: {formatDate(transaction.created_at)}</div>
                          {transaction.completed_at && (
                            <div>完了日時: {formatDate(transaction.completed_at)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(transaction.amount)}
                        </div>
                      </div>
                    </div>

                    {transaction.status === 'completed' && (
                      <div className="flex space-x-2">
                        <Link
                          href={`/projects/${transaction.app_id}`}
                          className="px-4 py-2 bg-blue-600 text-white border-2 text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          プロダクトを見る
                        </Link>
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 border-2 text-sm font-medium hover:bg-gray-200 transition-colors">
                          領収書をダウンロード
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  取引履歴がありません
                </h3>
                <p className="text-gray-600 mb-6">
                  {userType === 'seller'
                    ? 'プロダクトを投稿して販売を始めましょう'
                    : 'プロダクトを購入すると、ここに表示されます'}
                </p>
                <Link
                  href={userType === 'seller' ? '/projects/new' : '/apps'}
                  className="inline-block bg-blue-600 text-white px-6 py-3 border-2 font-semibold hover:bg-blue-700 transition-colors"
                >
                  {userType === 'seller' ? 'プロダクトを投稿' : 'プロダクトを探す'}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
