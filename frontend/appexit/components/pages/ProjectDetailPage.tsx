'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { LayoutDashboard, Monitor, Activity } from 'lucide-react';
import Button from '@/components/ui/Button';
import StorageImage from '@/components/ui/StorageImage';
import ImageModal from '@/components/ui/ImageModal';
import CommentSection from '@/components/comments/CommentSection';
import { Post } from '@/lib/api-client';
import { getImageUrls } from '@/lib/storage';
import { truncateDisplayName } from '@/lib/text-utils';

interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string;
  role: string;
  party: string;
}

interface PostWithDetails extends Post {
  author_profile?: AuthorProfile;
}

interface ProjectDetailPageProps {
  projectId: string;
  initialData?: {
    title?: string;
    category?: string;
    imagePath?: string;
    price?: number;
    status?: string;
  };
  postDetails?: PostWithDetails | null;
  pageDict?: Record<string, any>; // ページ固有翻訳（遅延ロード）
}

type TabType = 'overview' | 'activity' | 'comments';

export default function ProjectDetailPage({
  projectId,
  initialData,
  postDetails,
  pageDict = {}
}: ProjectDetailPageProps) {
  const t = useTranslations('projects');
  const tGlobal = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImagePath, setSelectedImagePath] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  // カードからの初期データを使用（APIレスポンスがあればそちらを優先）
  const displayTitle = postDetails?.title || initialData?.title || t('title');
  const displayImagePath = postDetails?.eyecatch_url || initialData?.imagePath || null;
  const displayCategory = postDetails?.app_categories?.[0] || initialData?.category || tGlobal('common.category');
  const displayPrice = postDetails?.price || initialData?.price;
  const displayStatus = postDetails ? (postDetails.is_active ? tGlobal('transactions.statuses.pending') : tGlobal('transactions.statuses.completed')) : (initialData?.status || tGlobal('transactions.statuses.pending'));
  const displayAppealText = postDetails?.appeal_text || postDetails?.body || tGlobal('common.loading');

  // 投稿者のプロフィール情報
  const authorProfile = postDetails?.author_profile;

  // 利益率の計算
  const profitMargin = postDetails?.monthly_revenue && postDetails?.monthly_cost !== undefined && postDetails?.monthly_revenue > 0
    ? ((postDetails.monthly_revenue - postDetails.monthly_cost) / postDetails.monthly_revenue) * 100
    : undefined;

  // 成約状況のバッジ色
  const getStatusBadgeColor = (status: string) => {
    const pendingText = tGlobal('transactions.statuses.pending');
    const processingText = tGlobal('transactions.statuses.processing');
    const completedText = tGlobal('transactions.statuses.completed');

    // 翻訳されたステータス名で判定
    if (status === pendingText) {
      return 'bg-green-100 text-green-800';
    } else if (status === processingText) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === completedText) {
      return 'bg-gray-100 text-gray-800';
    }

    // デフォルト（保留中の色）
    return 'bg-green-100 text-green-800';
  };

  if (!postDetails && !initialData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#323232' }}>{t('noResults')}</h1>
          <Link href={`/${locale}`} className="hover:underline" style={{ color: '#E65D65' }}>
            {tGlobal('errors.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  // 画像URLを一括取得（パフォーマンス最適化）
  useEffect(() => {
    if (!postDetails) return;

    const imagePaths: string[] = [];

    // メイン画像
    if (postDetails.eyecatch_url) {
      imagePaths.push(postDetails.eyecatch_url);
    }

    // 追加画像
    if (postDetails.extra_image_urls && Array.isArray(postDetails.extra_image_urls)) {
      imagePaths.push(...postDetails.extra_image_urls);
    }

    // スクリーンショット画像
    if (postDetails.dashboard_url) {
      imagePaths.push(postDetails.dashboard_url);
    }
    if (postDetails.user_ui_url) {
      imagePaths.push(postDetails.user_ui_url);
    }
    if (postDetails.performance_url) {
      imagePaths.push(postDetails.performance_url);
    }

    // アバター画像
    if (postDetails.author_profile?.icon_url) {
      imagePaths.push(postDetails.author_profile.icon_url);
    }

    // 画像がない場合はスキップ
    if (imagePaths.length === 0) return;

    // 一括取得
    getImageUrls(imagePaths).then(urlMap => {
      setImageUrls(urlMap);
    }).catch(() => {
      // Failed to fetch image URLs - continue without images
    });
  }, [postDetails]);

  const handleMessageClick = () => {
    if (!postDetails?.author_user_id) {
      return;
    }
    router.push(`/${locale}/messages/${postDetails.author_user_id}`);
  };

  const handleImageClick = (imagePath: string, index: number) => {
    setSelectedImagePath(imagePath);
    setSelectedImageIndex(index);
    setModalOpen(true);
  };

  // 初期状態でメイン画像を選択
  useEffect(() => {
    if (!selectedImagePath && displayImagePath) {
      setSelectedImagePath(displayImagePath);
      setSelectedImageIndex(-1);
    }
  }, [displayImagePath, selectedImagePath]);

  return (
    <>
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imagePath={selectedImagePath}
        imageIndex={selectedImageIndex}
        totalImages={
          selectedImageIndex >= 0 && postDetails?.extra_image_urls
            ? postDetails.extra_image_urls.length + 1
            : 1
        }
      />
      <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側: 画像と詳細情報 */}
          <div className="lg:col-span-2">
            {/* メイン画像表示（カードと同じ幅） */}
            <div className="relative bg-gray-100 rounded-sm overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
              <StorageImage
                path={selectedImagePath || displayImagePath}
                alt={displayTitle}
                signedUrl={(selectedImagePath || displayImagePath) ? imageUrls.get(selectedImagePath || displayImagePath || '') : undefined}
                width={1600}
                height={900}
                className="w-full h-full object-cover"
                priority
              />
              <button
                onClick={() => setModalOpen(true)}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
                aria-label={t('projectDetail.expand')}
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </button>
            </div>

            {/* サムネイル一覧（メイン画像の下部に配置、グリッド表示で折り返し） */}
            {postDetails?.extra_image_urls && postDetails.extra_image_urls.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 mb-6">
                {/* メイン画像のサムネイル */}
                <button
                  onClick={() => {
                    setSelectedImagePath(displayImagePath || '');
                    setSelectedImageIndex(-1);
                  }}
                  className={`relative bg-gray-100 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                    selectedImagePath === displayImagePath || selectedImageIndex === -1 ? 'border-dashed' : 'border-gray-300'
                  }`}
                  style={{
                    aspectRatio: '1/1',
                    borderColor: selectedImagePath === displayImagePath || selectedImageIndex === -1 ? '#323232' : undefined
                  }}
                >
                  <StorageImage
                    path={displayImagePath}
                    alt={displayTitle}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    signedUrl={displayImagePath ? imageUrls.get(displayImagePath) : undefined}
                  />
                </button>

                {/* 追加画像のサムネイル */}
                {postDetails.extra_image_urls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImagePath(url);
                      setSelectedImageIndex(index);
                    }}
                    className={`relative bg-gray-100 rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 ${
                      selectedImagePath === url && selectedImageIndex === index ? 'border-dashed' : 'border-gray-300'
                    }`}
                    style={{
                      aspectRatio: '1/1',
                      borderColor: selectedImagePath === url && selectedImageIndex === index ? '#323232' : undefined
                    }}
                  >
                    <StorageImage
                      path={url}
                      alt={t('projectDetail.additionalImage', { index: index + 1 })}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      signedUrl={imageUrls.get(url)}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-6">

            {/* スクリーンショット */}
            {(postDetails?.dashboard_url || postDetails?.user_ui_url || postDetails?.performance_url) && (
              <div>
                <div className="overflow-x-auto">
                  <div className="flex gap-3">
                    {postDetails.dashboard_url && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center mb-2">
                          <LayoutDashboard size={20} style={{ color: '#9CA3AF' }} />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedImagePath(postDetails.dashboard_url!);
                            setSelectedImageIndex(-1);
                            setModalOpen(true);
                          }}
                          className="bg-gray-100 rounded-sm overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ height: '95px', minWidth: '95px' }}
                        >
                          <StorageImage
                            path={postDetails.dashboard_url}
                            alt={t('projectDetail.dashboard')}
                            width={300}
                            height={95}
                            className="max-h-full w-auto object-contain"
                            signedUrl={postDetails.dashboard_url ? imageUrls.get(postDetails.dashboard_url) : undefined}
                          />
                        </button>
                      </div>
                    )}
                    {postDetails.user_ui_url && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center mb-2">
                          <Monitor size={20} style={{ color: '#9CA3AF' }} />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedImagePath(postDetails.user_ui_url!);
                            setSelectedImageIndex(-1);
                            setModalOpen(true);
                          }}
                          className="bg-gray-100 rounded-sm overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ height: '95px', minWidth: '95px' }}
                        >
                          <StorageImage
                            path={postDetails.user_ui_url}
                            alt={t('projectDetail.userUi')}
                            width={300}
                            height={95}
                            className="max-h-full w-auto object-contain"
                            signedUrl={postDetails.user_ui_url ? imageUrls.get(postDetails.user_ui_url) : undefined}
                          />
                        </button>
                      </div>
                    )}
                    {postDetails.performance_url && (
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center mb-2">
                          <Activity size={20} style={{ color: '#9CA3AF' }} />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedImagePath(postDetails.performance_url!);
                            setSelectedImageIndex(-1);
                            setModalOpen(true);
                          }}
                          className="bg-gray-100 rounded-sm overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ height: '95px', minWidth: '95px' }}
                        >
                          <StorageImage
                            path={postDetails.performance_url}
                            alt={t('projectDetail.performance')}
                            width={300}
                            height={95}
                            className="max-h-full w-auto object-contain"
                            signedUrl={postDetails.performance_url ? imageUrls.get(postDetails.performance_url) : undefined}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* タブ風のナビゲーション */}
            <div className="bg-white rounded-sm">
              <div className="">
                <nav className="flex justify-between px-2 sm:px-6 border-b border-gray-200" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 flex-1 text-sm font-bold transition-colors ${
                      activeTab === 'overview'
                        ? 'border-b-2'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === 'overview' ? { color: '#E65D65', borderColor: '#E65D65' } : {}}
                  >
                    <span className="sm:hidden">{t('projectDetail.overviewTab')}</span>
                    <span className="hidden sm:inline">{t('projectDetail.overviewTabFull')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`py-4 flex-1 text-sm font-bold transition-colors ${
                      activeTab === 'activity'
                        ? 'border-b-2'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === 'activity' ? { color: '#E65D65', borderColor: '#E65D65' } : {}}
                  >
                    <span className="sm:hidden">{t('projectDetail.detailsTab')}</span>
                    <span className="hidden sm:inline">{t('projectDetail.detailsTabFull')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`py-4 flex-1 text-sm font-bold transition-colors ${
                      activeTab === 'comments'
                        ? 'border-b-2'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={activeTab === 'comments' ? { color: '#E65D65', borderColor: '#E65D65' } : {}}
                  >
                    {t('projectDetail.commentsTab')}
                  </button>
                </nav>
              </div>

              {/* コンテンツエリア */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <>
                    <h2 className="text-xl font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.about')}</h2>
                    <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                      {displayAppealText}
                    </div>

                    {/* サービスURL */}
                    {postDetails?.service_urls && postDetails.service_urls.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-bold mb-3" style={{ color: '#323232' }}>{t('projectDetail.serviceUrls')}</h3>
                        <div className="space-y-2">
                          {postDetails.service_urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm hover:underline"
                              style={{ color: '#E65D65' }}
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-6">
                    {/* 収益情報 */}
                    <div>
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.revenueInfo')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {postDetails?.monthly_revenue !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('projectDetail.monthlyRevenue')}</p>
                            <p className="text-xl font-bold" style={{ color: '#323232' }}>
                              {postDetails.monthly_revenue.toLocaleString()}{tGlobal('common.jpyCurrency')}
                            </p>
                          </div>
                        )}
                        {postDetails?.monthly_cost !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('projectDetail.monthlyCost')}</p>
                            <p className="text-xl font-bold" style={{ color: '#323232' }}>
                              {postDetails.monthly_cost.toLocaleString()}{tGlobal('common.jpyCurrency')}
                            </p>
                          </div>
                        )}
                        {postDetails?.monthly_profit !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('projectDetail.monthlyProfit')}</p>
                            <p className="text-xl font-bold" style={{ color: '#323232' }}>
                              {postDetails.monthly_profit.toLocaleString()}{tGlobal('common.jpyCurrency')}
                            </p>
                          </div>
                        )}
                        {profitMargin !== undefined && (
                          <div className="p-4 bg-gray-50 rounded-sm">
                            <p className="text-sm text-gray-500 mb-1">{t('projectDetail.profitMargin')}</p>
                            <p className="text-xl font-bold" style={{ color: '#323232' }}>
                              {profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 収益モデル */}
                    {postDetails?.revenue_models && postDetails.revenue_models.length > 0 && (
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: '#323232' }}>{t('projectDetail.revenueModels')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {postDetails.revenue_models.map((model, index) => (
                            <span key={index} className="px-3 py-1 text-sm rounded-full border" style={{ backgroundColor: '#fff', color: '#323232', borderColor: '#323232' }}>
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ユーザー情報 */}
                    {postDetails?.user_count !== undefined && (
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.userInfo')}</h3>
                        <div className="p-4 bg-gray-50 rounded-sm">
                          <p className="text-sm text-gray-500 mb-1">{t('projectDetail.userCount')}</p>
                          <p className="text-xl font-bold" style={{ color: '#323232' }}>
                            {postDetails.user_count.toLocaleString()}人
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ターゲット顧客 */}
                    {postDetails?.target_customers && (
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: '#323232' }}>{t('projectDetail.targetCustomers')}</h4>
                        <p className="text-sm text-gray-600">{postDetails.target_customers}</p>
                      </div>
                    )}

                    {/* 技術スタック */}
                    {postDetails?.tech_stack && postDetails.tech_stack.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.techStack')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {postDetails.tech_stack.map((tech, index) => (
                            <span key={index} className="px-3 py-1 text-sm rounded-full border" style={{ backgroundColor: '#fff', color: '#323232', borderColor: '#323232' }}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* リリース日 */}
                    {postDetails?.release_date && (
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: '#323232' }}>{t('projectDetail.releaseDate')}</h4>
                        <p className="text-sm text-gray-600">{postDetails.release_date}</p>
                      </div>
                    )}

                    {/* 運営情報 */}
                    {(postDetails?.operation_form || postDetails?.operation_effort) && (
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.operationInfo')}</h3>
                        <div className="space-y-3">
                          {postDetails.operation_form && (
                            <div>
                              <h4 className="font-semibold mb-1 text-sm" style={{ color: '#323232' }}>{t('projectDetail.operationForm')}</h4>
                              <p className="text-sm text-gray-600">
                                {postDetails.operation_form === 'individual' ? t('form.individual') : postDetails.operation_form === 'corporate' ? t('form.corporate') : postDetails.operation_form}
                              </p>
                            </div>
                          )}
                          {postDetails.operation_effort && (
                            <div>
                              <h4 className="font-semibold mb-1 text-sm" style={{ color: '#323232' }}>{t('projectDetail.operationEffort')}</h4>
                              <p className="text-sm text-gray-600">{postDetails.operation_effort}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 引き渡し情報 */}
                    {(postDetails?.transfer_items || postDetails?.desired_transfer_timing) && (
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.transferInfo')}</h3>
                        <div className="space-y-3">
                          {postDetails.transfer_items && postDetails.transfer_items.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 text-sm" style={{ color: '#323232' }}>{t('projectDetail.transferItems')}</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {postDetails.transfer_items.map((item, index) => (
                                  <li key={index} className="text-sm text-gray-600">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {postDetails.desired_transfer_timing && (
                            <div>
                              <h4 className="font-semibold mb-1 text-sm" style={{ color: '#323232' }}>{t('projectDetail.transferTiming')}</h4>
                              <p className="text-sm text-gray-600">{postDetails.desired_transfer_timing}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 成長可能性 */}
                    {postDetails?.growth_potential && (
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: '#323232' }}>{t('projectDetail.growthPotential')}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{postDetails.growth_potential}</p>
                      </div>
                    )}

                    {/* マーケティング */}
                    {postDetails?.marketing_channels && postDetails.marketing_channels.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>{t('projectDetail.marketingChannels')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {postDetails.marketing_channels.map((channel, index) => (
                            <span key={index} className="px-3 py-1 text-sm rounded-full border" style={{ backgroundColor: '#fff', color: '#323232', borderColor: '#323232' }}>
                              {channel}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* メディア掲載 */}
                    {postDetails?.media_mentions && (
                      <div>
                        <h4 className="font-bold mb-2" style={{ color: '#323232' }}>{t('projectDetail.mediaMentions')}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{postDetails.media_mentions}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && postDetails?.id && (
                  <CommentSection postId={postDetails.id} />
                )}
              </div>
            </div>
            </div>
          </div>

          {/* 右側: 購入・支援ボックス */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-sm p-6 sticky top-4">
              {/* カテゴリとステータス */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {/* すべてのカテゴリを表示（最大3つ + ... ） */}
                {(() => {
                  const categories = postDetails?.app_categories || [displayCategory];
                  const displayCategories = categories.slice(0, 3);
                  const hasMore = categories.length > 3;

                  return (
                    <>
                      {displayCategories.map((cat, index) => (
                        <span key={index} className="text-xs font-semibold" style={{ color: '#E65D65' }}>
                          #{cat}
                        </span>
                      ))}
                      {hasMore && (
                        <span className="text-xs font-semibold" style={{ color: '#E65D65' }}>
                          ...
                        </span>
                      )}
                    </>
                  );
                })()}
                <span className={`px-2 py-1 rounded font-semibold text-xs ${getStatusBadgeColor(displayStatus)}`}>
                  {displayStatus}
                </span>
              </div>

              {/* プロジェクトタイトル */}
              <h1 className="text-2xl font-bold mb-4 line-clamp-3" style={{ color: '#323232' }}>
                {displayTitle}
              </h1>

              {/* 価格情報 */}
              <div className="mb-6">
                {displayPrice !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('projectDetail.desiredPrice')}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold" style={{ color: '#323232' }}>
                        {displayPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-600">{tGlobal('common.jpyCurrency')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full rounded-sm bg-transparent border-2 hover:opacity-80 justify-between !px-4 !py-3"
                  style={{ borderColor: '#E65D65', color: '#E65D65' }}
                  onClick={handleMessageClick}
                >
                  {t('projectDetail.sendMessage')}
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
              </div>

              {/* 投稿者情報 */}
              <div className="pt-6 border-t border-gray-200">
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
                            signedUrl={authorProfile.icon_url ? imageUrls.get(authorProfile.icon_url) : undefined}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold" style={{ color: '#323232' }}>
                            {authorProfile.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold" style={{ color: '#323232' }} title={authorProfile.display_name}>
                          {truncateDisplayName(authorProfile.display_name, 'profile')}
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
                    <p>{t('projectDetail.createdAt', { date: new Date(postDetails.created_at).toLocaleDateString(locale) })}</p>
                    {postDetails.updated_at !== postDetails.created_at && (
                      <p>{t('projectDetail.updatedAt', { date: new Date(postDetails.updated_at).toLocaleDateString(locale) })}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
