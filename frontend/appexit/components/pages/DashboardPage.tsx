'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProjectCard from '@/components/ui/ProjectCard'

interface DashboardStats {
  totalProjects: number
  totalMessages: number
  activeBids: number
  completedDeals: number
}

export default function DashboardPage() {
  const [userType, setUserType] = useState<'buyer' | 'seller' | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalMessages: 0,
    activeBids: 0,
    completedDeals: 0,
  })

  useEffect(() => {
    // LocalStorageからユーザータイプを取得
    const storedUserType = localStorage.getItem('userType') as 'buyer' | 'seller'
    setUserType(storedUserType)

    // TODO: APIからダッシュボード統計を取得
    // 仮のデータ
    setStats({
      totalProjects: 5,
      totalMessages: 12,
      activeBids: 3,
      completedDeals: 2,
    })
  }, [])

  const buyerQuickLinks = [
    { title: 'プロダクトを探す', href: '/apps', icon: '🔍' },
    { title: '掲示板を見る', href: '/boards', icon: '📋' },
    { title: 'メッセージ', href: '/messages', icon: '💬' },
    { title: '取引履歴', href: '/transactions', icon: '📊' },
  ]

  const sellerQuickLinks = [
    { title: 'プロダクトを投稿', href: '/projects/new', icon: '➕' },
    { title: '掲示板に投稿', href: '/boards/new', icon: '📝' },
    { title: '自分の投稿', href: '/my-projects', icon: '📱' },
    { title: 'メッセージ', href: '/messages', icon: '💬' },
  ]

  const quickLinks = userType === 'seller' ? sellerQuickLinks : buyerQuickLinks

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h1>
          <p className="text-gray-600 mt-2">
            {userType === 'seller' ? '売り手' : '買い手'}として利用中
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-transparent p-6">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
            <div className="text-sm text-gray-600">
              {userType === 'seller' ? '投稿中' : '興味のある案件'}
            </div>
          </div>

          <div className="bg-transparent p-6">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalMessages}</div>
            <div className="text-sm text-gray-600">未読メッセージ</div>
          </div>

          <div className="bg-transparent p-6">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeBids}</div>
            <div className="text-sm text-gray-600">
              {userType === 'seller' ? '商談中' : '申込中'}
            </div>
          </div>

          <div className="bg-transparent p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-gray-900">{stats.completedDeals}</div>
            <div className="text-sm text-gray-600">完了した取引</div>
          </div>
        </div>

        {/* クイックリンク */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-transparent p-6 hover:bg-blue-50/50 transition-colors duration-200 text-center"
              >
                <div className="text-4xl mb-2">{link.icon}</div>
                <div className="font-semibold text-gray-900">{link.title}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* 最近のアクティビティ */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              最近のアクティビティ
            </h2>
            <Link href="/activity" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              すべて見る →
            </Link>
          </div>
          <div className="bg-transparent">
            <div className="p-4 space-y-4">
              {/* 仮のアクティビティデータ */}
              <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                <div className="text-2xl">💬</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    新しいメッセージを受信しました
                  </p>
                  <p className="text-xs text-gray-500 mt-1">2時間前</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 pb-4 border-b border-gray-100">
                <div className="text-2xl">📱</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    新しいプロダクトが投稿されました
                  </p>
                  <p className="text-xs text-gray-500 mt-1">5時間前</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✅</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    取引が完了しました
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1日前</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* おすすめのプロダクト（買い手の場合） */}
        {userType === 'buyer' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                おすすめのプロダクト
              </h2>
              <Link href="/apps" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                すべて見る →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TODO: APIからプロジェクトデータを取得して表示 */}
              <p className="text-gray-500 col-span-3 text-center py-8">プロジェクトデータを読み込み中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
