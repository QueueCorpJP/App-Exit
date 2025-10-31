'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import StorageImage from './StorageImage';

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
  category: string;
  image: string; // 署名付きURL（表示用）
  imagePath?: string | null; // Storageのパス（詳細ページに渡す用）
  supporters: number;
  daysLeft: number;
  amountRaised: number;
  tag?: string;
  badge?: string;
  size?: 'small' | 'large';
  authorProfile?: AuthorProfile | null;
}

export default function ProjectCard({
  id,
  title,
  category,
  image,
  imagePath,
  supporters,
  daysLeft,
  amountRaised,
  tag,
  badge,
  size = 'small',
  authorProfile
}: ProjectCardProps) {
  const isLarge = size === 'large';
  const [imageError, setImageError] = useState(false);
  const fallbackImage = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

  // デバッグ: 最初の数個のカードだけログ出力
  if (typeof id === 'string' && id.length > 0) {
    console.log(`[PROJECT-CARD] id=${id}, imagePath="${imagePath}", image="${image?.substring(0, 80)}..."`);
  }

  // カード情報をクエリパラメータとして渡す
  // imagePathがあればそれを、なければimageを渡す
  const queryParams = new URLSearchParams({
    title,
    category,
    imagePath: imagePath || '',
  });

  return (
    <Link href={`/projects/${id}?${queryParams.toString()}`} className="block">
      <div className="bg-white overflow-hidden hover:bg-gray-50 transition-colors">
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
        <div className="py-4 px-8">
          {tag && (
            <span className="inline-block bg-red-50 text-red-600 text-xs px-2 py-1 rounded mb-2">
              {tag}
            </span>
          )}
          <p className="text-xs text-gray-500 mb-1">{category}</p>
          <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 ${isLarge ? 'text-lg' : 'text-sm'}`}>
            {title}
          </h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1 font-semibold text-gray-900">
              <span>{amountRaised.toLocaleString()}円</span>
            </div>
          </div>

          {/* 投稿者情報 */}
          {authorProfile && (
            <div className="mt-3 pt-3 border-t border-gray-100">
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
                    <span className="text-xs font-bold text-gray-600">
                      {authorProfile.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-600 truncate">{authorProfile.display_name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
