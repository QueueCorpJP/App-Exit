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
}

/**
 * Supabase Storageの画像を表示するコンポーネント
 * パスから自動的に署名付きURLを生成して表示します
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
}: StorageImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/600x400/e2e8f0/64748b?text=Loading...');
  const [error, setError] = useState(false);

  useEffect(() => {
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
  }, [path]);

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
