import { getAuthToken } from './cookie-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * バックエンドAPI経由で画像をアップロードする
 * @param file アップロードする画像ファイル
 * @param userId アップロードするユーザーのID（オプション、認証済みの場合は不要）
 * @param bucket バケット名（デフォルト: post-images）
 * @param filePath カスタムファイルパス（オプション）
 * @returns アップロードされた画像のパス
 */
export async function uploadImage(
  file: File,
  userId?: string,
  bucket: string = 'post-images',
  filePath?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);

  if (filePath) {
    formData.append('filePath', filePath);
  }

  console.log('[STORAGE] Uploading image:', { bucket, filePath, size: file.size });

  // Get token from cookie
  const token = getAuthToken();
  if (!token) {
    console.error('[STORAGE] No authentication token found in cookies');
    throw new Error('Missing authentication token');
  }

  console.log('[STORAGE] Using auth token from cookie');

  const response = await fetch(`${API_URL}/api/storage/upload`, {
    method: 'POST',
    credentials: 'include', // Cookie認証
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    console.error('[STORAGE] Upload error:', error);
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  console.log('[STORAGE] Upload successful:', result.data.path);
  return result.data.path;
}

/**
 * アバター画像をアップロードする
 * @param file アップロードする画像ファイル
 * @param userId アップロードするユーザーのID（オプション）
 * @returns アップロードされた画像のパス
 */
export async function uploadAvatarImage(file: File, userId?: string): Promise<string> {
  return uploadImage(file, userId, 'avatars');
}

/**
 * バックエンドAPI経由で画像の署名付きURLを取得する
 * @param path 画像のパス
 * @param bucket バケット名（デフォルト: 自動判定）
 * @param expiresIn URL の有効期限（秒）デフォルトは1時間
 * @returns 署名付きURL
 */
export async function getImageUrl(
  path: string | null | undefined,
  bucket?: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!path) {
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  }

  // パスからバケット名を自動判定
  let actualPath = path;
  let actualBucket = bucket;

  if (!actualBucket) {
    if (path.startsWith('avatars/')) {
      actualBucket = 'avatars';
      actualPath = path.substring('avatars/'.length); // バケット名を除去
    } else if (path.startsWith('message-images/')) {
      actualBucket = 'message-images';
      actualPath = path.substring('message-images/'.length);
    } else {
      actualBucket = 'post-images';
      // post-imagesの場合はパスをそのまま使用
    }
  }

  try {
    const response = await fetch(`${API_URL}/api/storage/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ bucket: actualBucket, path: actualPath, expiresIn }),
    });

    if (!response.ok) {
      console.error('[STORAGE] Failed to get signed URL:', response.status, 'bucket:', actualBucket, 'path:', actualPath);
      return 'https://placehold.co/600x400/e2e8f0/64748b?text=Error';
    }

    const result = await response.json();
    return result.data.signedUrl;
  } catch (error) {
    console.error('[STORAGE] Error getting signed URL:', error);
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=Error';
  }
}

/**
 * 複数の画像の署名付きURLを一括取得する
 * @param paths 画像のパスの配列
 * @param bucket バケット名（デフォルト: 自動判定）
 * @param expiresIn URL の有効期限（秒）デフォルトは1時間
 * @returns パスをキーとした署名付きURLのマップ
 */
export async function getImageUrls(
  paths: string[],
  bucket?: string,
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  if (paths.length === 0) {
    return urlMap;
  }

  // パスを分析してバケットごとにグループ化
  const bucketGroups = new Map<string, string[]>();

  paths.forEach(path => {
    let actualBucket = bucket;
    let actualPath = path;

    if (!actualBucket) {
      if (path.startsWith('avatars/')) {
        actualBucket = 'avatars';
        actualPath = path.substring('avatars/'.length);
      } else if (path.startsWith('message-images/')) {
        actualBucket = 'message-images';
        actualPath = path.substring('message-images/'.length);
      } else {
        actualBucket = 'post-images';
      }
    }

    if (!bucketGroups.has(actualBucket)) {
      bucketGroups.set(actualBucket, []);
    }
    bucketGroups.get(actualBucket)!.push(actualPath);
  });

  // 各バケットごとにまとめてリクエスト
  for (const [bucketName, bucketPaths] of bucketGroups) {
    try {
      const response = await fetch(`${API_URL}/api/storage/signed-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ bucket: bucketName, paths: bucketPaths, expiresIn }),
      });

      if (!response.ok) {
        console.error('[STORAGE] Failed to get signed URLs for bucket:', bucketName, response.status);
        continue;
      }

      const result = await response.json();
      const urls = result.data.urls;

      // 元のパス（バケット名を含む）をキーとしてマップに追加
      for (const [actualPath, url] of Object.entries(urls)) {
        const originalPath = bucketName === 'post-images' ? actualPath : `${bucketName}/${actualPath}`;
        urlMap.set(originalPath, url as string);
      }
    } catch (error) {
      console.error('[STORAGE] Error getting signed URLs for bucket:', bucketName, error);
    }
  }

  return urlMap;
}
