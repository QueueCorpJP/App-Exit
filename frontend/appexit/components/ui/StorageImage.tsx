'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/storage';

interface StorageImageProps {
  path: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  signedUrl?: string; // 事前取得した署名付きURL（パフォーマンス最適化用）
}

/**
 * Supabase Storageの画像を表示するコンポーネント
 * - signedUrlが渡された場合：そのURLを直接使用（高速）
 * - signedUrlがない場合：パスから自動的に署名付きURLを生成（後方互換）
 */
export default function StorageImage({
  path,
  alt,
  fill,
  width,
  height,
  className,
  priority,
  sizes,
  signedUrl,
}: StorageImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(
    signedUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=Loading...'
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    // signedUrlが渡されている場合は個別取得をスキップ（パフォーマンス最適化）
    if (signedUrl) {
      setImageUrl(signedUrl);
      return;
    }

    const loadImage = async () => {
      try {
        const url = await getImageUrl(path);
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
        setImageUrl('https://placehold.co/600x400/e2e8f0/64748b?text=Error');
      }
    };

    loadImage();
  }, [path, signedUrl]);

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={className}
        priority={priority}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        onError={() => {
          setError(true);
          setImageUrl('https://placehold.co/600x400/e2e8f0/64748b?text=Error');
        }}
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width || 600}
      height={height || 400}
      className={className}
      priority={priority}
      onError={() => {
        setError(true);
        setImageUrl('https://placehold.co/600x400/e2e8f0/64748b?text=Error');
      }}
    />
  );
}
