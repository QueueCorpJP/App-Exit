'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import StorageImage from './StorageImage';
import { activeViewApi } from '@/lib/api-client';

interface AuthorProfile {
  id: string;
  display_name: string;
  icon_url?: string | null;
  role: string;
  party: string;
}

interface ProjectCardProps {
  id: number | string;
  title: string;
  category: string | string[]; // 文字列または配列に対応
  image: string; // 署名付きURL（表示用）
  imagePath?: string | null; // Storageのパス（詳細ページに渡す用）
  price: number; // 希望価格
  monthlyRevenue?: number; // 月商
  monthlyCost?: number; // 月間コスト
  profitMargin?: number; // 利益率（%）
  status?: string; // 成約状況
  watchCount?: number; // ウォッチ数
  commentCount?: number; // コメント数
  updatedAt?: string; // 更新日
  tag?: string;
  badge?: string;
  size?: 'small' | 'large';
  authorProfile?: AuthorProfile | null;
  activeViewCount?: number; // アクティブビュー数
}

export default function ProjectCard({
  id,
  title,
  category,
  image,
  imagePath,
  price,
  monthlyRevenue,
  monthlyCost,
  profitMargin,
  status = '募集中',
  watchCount,
  commentCount,
  updatedAt,
  tag,
  badge,
  size = 'small',
  authorProfile,
  activeViewCount = 0
}: ProjectCardProps) {
  const isLarge = size === 'large';
  const [imageError, setImageError] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [localActiveViewCount, setLocalActiveViewCount] = useState(activeViewCount);
  const fallbackImage = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

  // デバッグ: 最初の数個のカードだけログ出力
  if (typeof id === 'string' && id.length > 0) {
    console.log(`[PROJECT-CARD] id=${id}, imagePath="${imagePath}", image="${image?.substring(0, 80)}..."`);
  }

  // アクティブビューの初期状態を取得
  useEffect(() => {
    const fetchActiveViewStatus = async () => {
      try {
        const response = await activeViewApi.getActiveViewStatus(String(id));
        if (response.success && response.data) {
          setIsWatching(response.data.is_active);
        }
      } catch (error) {
        console.error('[PROJECT-CARD] Failed to fetch active view status:', error);
        // エラーが発生した場合は、ログイン状態でない可能性があるため、無視
      }
    };

    fetchActiveViewStatus();
  }, [id]);

  // カード情報をクエリパラメータとして渡す（初期表示用の最小限の情報）
  const queryParams = new URLSearchParams({
    title,
    category,
    imagePath: imagePath || '',
    price: price.toString(),
    status: status || '',
  });

  // 更新日をフォーマット
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  // 成約状況のバッジ色を決定
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case '募集中':
        return 'bg-green-100 text-green-800';
      case '交渉中':
        return 'bg-yellow-100 text-yellow-800';
      case '成約済み':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // ウォッチボタンのクリック処理
  const handleWatchClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Linkの遷移を防止
    e.stopPropagation();
    
    try {
      if (isWatching) {
        // アクティブビューを削除
        const response = await activeViewApi.deleteActiveView(String(id));
        setIsWatching(false);
        // バックエンドから返された最新のカウント数を使用
        if (response.active_view_count !== undefined) {
          setLocalActiveViewCount(response.active_view_count);
        } else {
          setLocalActiveViewCount(prev => Math.max(0, prev - 1));
        }
        console.log('[PROJECT-CARD] Active view removed, new count:', response.active_view_count);
      } else {
        // アクティブビューを追加
        const response = await activeViewApi.createActiveView(String(id));
        setIsWatching(true);
        // バックエンドから返された最新のカウント数を使用
        if (response.active_view_count !== undefined) {
          setLocalActiveViewCount(response.active_view_count);
        } else {
          setLocalActiveViewCount(prev => prev + 1);
        }
        console.log('[PROJECT-CARD] Active view added, new count:', response.active_view_count);
      }
    } catch (error: any) {
      console.error('[PROJECT-CARD] Failed to toggle active view:', error);
      
      // エラーメッセージを表示
      if (error?.status === 401) {
        alert('ログインが必要です');
      } else if (error?.data?.error) {
        alert(error.data.error);
      } else {
        alert('アクティブビューの更新に失敗しました');
      }
      
      // エラーが発生した場合は状態を元に戻さない（すでに変更していないため）
    }
  };

  return (
    <Link href={`/projects/${id}?${queryParams.toString()}`} className="block">
      <div className="bg-white overflow-hidden hover:bg-gray-50 transition-colors rounded-sm relative">
        <div className={`relative ${isLarge ? 'h-80' : 'h-48'} bg-gray-200`}>
          <Image
            src={imageError ? fallbackImage : image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
          {badge && (
            <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded text-sm font-medium">
              {badge}
            </div>
          )}
        </div>
        <div className="py-4 px-4">
          {/* カテゴリとステータスを横並び */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* カテゴリ表示（最大3つまで） */}
            {(() => {
              const categories = Array.isArray(category) ? category : [category];
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
            {tag && (
              <span className="text-xs font-semibold" style={{ color: '#E65D65' }}>
                {tag}
              </span>
            )}
            <span className={`px-2 py-1 rounded font-semibold text-xs ${getStatusBadgeColor(status)}`}>
              {status}
            </span>
          </div>

          {/* タイトル */}
          <h3 className={`font-bold mb-3 line-clamp-1 ${isLarge ? 'text-lg' : 'text-base'}`} style={{ color: '#323232' }}>
            {title}
          </h3>

          {/* 価格・月商・利益率 */}
          <div className="mb-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">希望価格:</span>
              <span className="font-bold text-lg" style={{ color: '#323232' }}>{price.toLocaleString()}円</span>
            </div>
            {monthlyRevenue !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">月商:</span>
                <span className="font-semibold text-sm" style={{ color: '#323232' }}>{monthlyRevenue.toLocaleString()}円</span>
              </div>
            )}
            {profitMargin !== undefined && profitMargin > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">利益率:</span>
                <span className="font-semibold text-sm" style={{ color: '#323232' }}>{profitMargin.toFixed(0)}%</span>
              </div>
            )}
          </div>

          {/* ウォッチ・コメント */}
          {(watchCount !== undefined || commentCount !== undefined) && (
            <div className="flex items-center gap-3 mb-3 text-xs">
              {watchCount !== undefined && (
                <span style={{ color: '#323232' }}>👥 {watchCount}</span>
              )}
              {commentCount !== undefined && (
                <span style={{ color: '#323232' }}>💬 {commentCount}</span>
              )}
            </div>
          )}

          {/* 更新日 */}
          {updatedAt && (
            <div className="text-xs text-gray-400 mb-3">
              更新日: {formatDate(updatedAt)}
            </div>
          )}

          {/* 投稿者情報 */}
          {authorProfile && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {authorProfile.icon_url ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <StorageImage
                      path={authorProfile.icon_url}
                      alt={authorProfile.display_name}
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold" style={{ color: '#323232' }}>
                      {authorProfile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs truncate" style={{ color: '#323232' }}>{authorProfile.display_name}</span>
              </div>
            </div>
          )}
        </div>

        {/* ウォッチボタン（カード全体の右下） */}
        <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1">
          <button
            onClick={handleWatchClick}
            className={`p-2 rounded-full transition-all ${
              isWatching
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            aria-label={isWatching ? 'ウォッチ解除' : 'ウォッチ'}
          >
            <Eye className="w-5 h-5" />
          </button>
          {/* アクティブビュー数 */}
          <span className="text-xs font-semibold text-gray-700 bg-white rounded-full px-2 py-0.5">
            {localActiveViewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
