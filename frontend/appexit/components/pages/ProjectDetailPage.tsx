'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import StorageImage from '@/components/ui/StorageImage';
import CommentSection from '@/components/comments/CommentSection';

interface PostDetail {
  post_id: string;
  app_name?: string;
  app_category?: string;
  monthly_revenue?: number;
  monthly_profit?: number;
  mau?: number;
  dau?: number;
  store_url?: string;
  tech_stack?: string;
  notes?: string;
}

interface Post {
  id: string;
  author_user_id: string;
  author_org_id?: string;
  type: string;
  title: string;
  body?: string;
  cover_image_url?: string;
  budget_min?: number;
  budget_max?: number;
  price?: number;
  secret_visibility?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string;
  role: string;
  party: string;
}

interface PostWithDetails {
  id: string;
  author_user_id: string;
  author_org_id?: string;
  type: string;
  title: string;
  body?: string;
  cover_image_url?: string;
  budget_min?: number;
  budget_max?: number;
  price?: number;
  secret_visibility?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  details?: PostDetail;
  author_profile?: AuthorProfile;
}

interface ProjectDetailPageProps {
  projectId: string;
  initialData?: {
    title?: string;
    category?: string;
    imagePath?: string;
  };
  postDetails?: PostWithDetails | null;
}

type TabType = 'overview' | 'activity' | 'comments';

export default function ProjectDetailPage({
  projectId,
  initialData,
  postDetails
}: ProjectDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // カードからの初期データを使用
  const displayTitle = postDetails?.title || initialData?.title || 'プロジェクト';
  const displayImagePath = postDetails?.cover_image_url || initialData?.imagePath || null;
  const displayCategory = postDetails?.details?.app_category || initialData?.category || 'カテゴリ不明';
  const displayBody = postDetails?.body || 'プロジェクトの詳細情報を読み込んでいます...';
  const displayAppName = postDetails?.details?.app_name;

  // 投稿者のプロフィール情報はpostDetailsに含まれている
  const authorProfile = postDetails?.author_profile;

  if (!postDetails && !initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">プロジェクトが見つかりません</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const handleMessageClick = () => {
    if (!postDetails?.author_user_id) {
      console.error('Author user ID not found');
      return;
    }
    router.push(`/messages/${postDetails.author_user_id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 画像と詳細情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* メイン画像 */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative h-96 md:h-[500px] bg-gray-100">
                <StorageImage
                  path={displayImagePath}
                  alt={displayTitle}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            </div>

            {/* タブ風のナビゲーション */}
            <div className="bg-white rounded-lg">
              <div className="">
                <nav className="flex space-x-8 px-6 border-b border-gray-200" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'overview'
                        ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    プロジェクト概要
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-4 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'activity'
                        ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    活動報告
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'comments'
                        ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    コメント
                  </button>
                </nav>
              </div>

              {/* コンテンツエリア */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">プロジェクトについて</h2>
                    <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                      {displayBody}
                    </div>

                    {/* APIから取得した詳細情報 */}
                    {postDetails?.details && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">アプリ詳細</h3>
                        <div className="space-y-4">
                          {postDetails.details.monthly_revenue !== undefined && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">月間売上</h4>
                              <p className="text-lg font-bold text-gray-900">
                                ¥{postDetails.details.monthly_revenue.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {postDetails.details.monthly_profit !== undefined && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">月間利益</h4>
                              <p className="text-lg font-bold text-gray-900">
                                ¥{postDetails.details.monthly_profit.toLocaleString()}
                              </p>
                            </div>
                          )}
                          {postDetails.details.mau !== undefined && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">月間アクティブユーザー</h4>
                              <p className="text-lg font-bold text-gray-900">
                                {postDetails.details.mau.toLocaleString()}人
                              </p>
                            </div>
                          )}
                          {postDetails.details.dau !== undefined && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">日間アクティブユーザー</h4>
                              <p className="text-lg font-bold text-gray-900">
                                {postDetails.details.dau.toLocaleString()}人
                              </p>
                            </div>
                          )}
                          {postDetails.details.tech_stack && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">技術スタック</h4>
                              <p className="text-sm text-gray-600">{postDetails.details.tech_stack}</p>
                            </div>
                          )}
                          {postDetails.details.store_url && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">ストアURL</h4>
                              <a
                                href={postDetails.details.store_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {postDetails.details.store_url}
                              </a>
                            </div>
                          )}
                          {postDetails.details.notes && (
                            <div className="rounded-lg p-4">
                              <h4 className="font-semibold text-gray-800 mb-2">備考</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {postDetails.details.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'activity' && (
                  <div className="text-center py-8 text-gray-500">
                    活動報告機能は準備中です
                  </div>
                )}

                {activeTab === 'comments' && postDetails?.id && (
                  <CommentSection postId={postDetails.id} />
                )}
              </div>
            </div>
          </div>

          {/* 右側: 購入・支援ボックス */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              {/* カテゴリバッジ */}
              <span className="inline-block bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full mb-4">
                {postDetails?.type || 'transaction'}
              </span>

              {/* プロジェクトタイトル */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-3">
                {displayTitle}
              </h1>

              {/* アプリ名 */}
              {displayAppName && (
                <p className="text-sm text-gray-500 mb-2">アプリ名: {displayAppName}</p>
              )}

              {/* カテゴリ */}
              <p className="text-sm text-gray-500 mb-6">{displayCategory}</p>

              {/* 統計情報 */}
              <div className="space-y-4 mb-6">
                {postDetails?.price !== undefined && (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {postDetails.price.toLocaleString()}
                      </span>
                      <span className="text-gray-600">円</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">価格</p>
                  </div>
                )}

                {(postDetails?.budget_min !== undefined || postDetails?.budget_max !== undefined) && (
                  <div>
                    <div className="flex items-baseline gap-2">
                      {postDetails.budget_min !== undefined && postDetails.budget_max !== undefined ? (
                        <span className="text-xl font-bold text-gray-900">
                          {postDetails.budget_min.toLocaleString()} 〜 {postDetails.budget_max.toLocaleString()}円
                        </span>
                      ) : postDetails.budget_min !== undefined ? (
                        <span className="text-xl font-bold text-gray-900">
                          {postDetails.budget_min.toLocaleString()}円〜
                        </span>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">
                          〜{postDetails.budget_max?.toLocaleString()}円
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">予算範囲</p>
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="space-y-3">
                <Button 
                  variant="outline"
                  className="w-full rounded-lg bg-transparent border-2 hover:bg-blue-50 gap-2"
                  style={{ borderColor: '#1A73E8', color: '#1A73E8' }}
                >
                  このプロジェクトを支援する
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>

                <Button
                  variant="secondary"
                  className="w-full rounded-lg gap-2"
                  onClick={handleMessageClick}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  メッセージを送る
                </Button>
              </div>

              {/* 追加情報 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {authorProfile && (
                  <Link
                    href={`/profile/${authorProfile.id}`}
                    className="block mb-4 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      {authorProfile.icon_url ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <StorageImage
                            path={authorProfile.icon_url}
                            alt={authorProfile.display_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-gray-600">
                            {authorProfile.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {authorProfile.display_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{authorProfile.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )}

                {postDetails && (
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>作成日: {new Date(postDetails.created_at).toLocaleDateString('ja-JP')}</p>
                    {postDetails.updated_at !== postDetails.created_at && (
                      <p>更新日: {new Date(postDetails.updated_at).toLocaleDateString('ja-JP')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
