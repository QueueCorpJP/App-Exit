import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/storage';

/**
 * アバター画像のURLを取得するカスタムフック
 * icon_urlがファイル名の場合、Supabaseの署名付きURLに変換する
 *
 * @param iconUrl - プロフィールのicon_url（ファイル名または完全なURL）
 * @param bucket - バケット名（デフォルト: 'avatars'）
 * @returns 表示用のURL（署名付きURLまたはプレースホルダー）
 */
export function useAvatarUrl(iconUrl: string | null | undefined, bucket: string = 'avatars'): string {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadAvatarUrl = async () => {
      if (!iconUrl) {
        setAvatarUrl('');
        return;
      }

      // 既に完全なURLの場合はそのまま使用
      if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
        setAvatarUrl(iconUrl);
        return;
      }

      // ファイル名の場合、署名付きURLを取得
      try {
        const url = await getImageUrl(iconUrl, bucket);
        if (isMounted) {
          setAvatarUrl(url);
        }
      } catch (error) {
        console.error('Failed to load avatar URL:', error);
        if (isMounted) {
          setAvatarUrl('');
        }
      }
    };

    loadAvatarUrl();

    return () => {
      isMounted = false;
    };
  }, [iconUrl, bucket]);

  return avatarUrl;
}
