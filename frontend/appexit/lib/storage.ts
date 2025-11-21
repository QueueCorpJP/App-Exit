import { getApiUrl } from './auth-api';

const API_URL = getApiUrl();

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

  // HttpOnly Cookieで認証されるため、手動でトークンを取得する必要なし
  const response = await fetch(`${API_URL}/api/storage/upload`, {
    method: 'POST',
    credentials: 'include', // HttpOnly Cookieを自動送信
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
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

  // 既に完全なURLの場合はそのまま返す（外部URLや既に署名付きURLの場合）
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // パスからバケット名を自動判定
  let actualPath = path;
  let actualBucket = bucket;

  if (!actualBucket) {
    if (path.startsWith('avatars/')) {
      actualBucket = 'avatars';
      actualPath = path.substring('avatars/'.length); // バケット名を除去
    } else if (path.startsWith('profile-icons/')) {
      actualBucket = 'profile-icons';
      actualPath = path.substring('profile-icons/'.length);
      } else if (path.startsWith('message-images/')) {
        actualBucket = 'message-images';
        actualPath = path.substring('message-images/'.length);
      } else if (path.startsWith('contract-documents/')) {
        actualBucket = 'contract-documents';
        actualPath = path.substring('contract-documents/'.length);
      } else if (path.startsWith('post-images/')) {
        actualBucket = 'post-images';
        actualPath = path.substring('post-images/'.length);
      } else {
        // プレフィックスがない場合はpost-imagesと仮定
        actualBucket = 'post-images';
        // パスをそのまま使用
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
      return 'https://placehold.co/600x400/e2e8f0/64748b?text=Error';
    }

    const result = await response.json();
    return result.data.signedUrl;
  } catch (error) {
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
    // 既に完全なURLの場合はそのまま返す（外部URLや既に署名付きURLの場合）
    if (path.startsWith('http://') || path.startsWith('https://')) {
      urlMap.set(path, path);
      return;
    }

    let actualBucket = bucket;
    let actualPath = path;

    if (!actualBucket) {
      if (path.startsWith('avatars/')) {
        actualBucket = 'avatars';
        actualPath = path.substring('avatars/'.length);
      } else if (path.startsWith('profile-icons/')) {
        actualBucket = 'profile-icons';
        actualPath = path.substring('profile-icons/'.length);
      } else if (path.startsWith('message-images/')) {
        actualBucket = 'message-images';
        actualPath = path.substring('message-images/'.length);
      } else if (path.startsWith('contract-documents/')) {
        actualBucket = 'contract-documents';
        actualPath = path.substring('contract-documents/'.length);
      } else if (path.startsWith('post-images/')) {
        actualBucket = 'post-images';
        actualPath = path.substring('post-images/'.length);
      } else {
        // プレフィックスがない場合はpost-imagesと仮定
        actualBucket = 'post-images';
      }
    }

    if (!bucketGroups.has(actualBucket)) {
      bucketGroups.set(actualBucket, []);
    }
    bucketGroups.get(actualBucket)!.push(actualPath);
  });

  // 各バケットごとにまとめてリクエスト（並列処理）
  const bucketPromises = Array.from(bucketGroups.entries()).map(async ([bucketName, bucketPaths]) => {
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
        return new Map<string, string>();
      }

      const result = await response.json();
      const urls = result.data.urls;
      const bucketUrlMap = new Map<string, string>();

      // 元のパス（バケット名を含む）をキーとしてマップに追加
      for (const [actualPath, url] of Object.entries(urls)) {
        const originalPath = bucketName === 'post-images' ? actualPath : `${bucketName}/${actualPath}`;
        bucketUrlMap.set(originalPath, url as string);
      }

      return bucketUrlMap;
    } catch (error) {
      return new Map<string, string>();
    }
  });

  // すべてのバケットのリクエストを並列実行
  const bucketResults = await Promise.all(bucketPromises);

  // 結果を統合
  for (const bucketUrlMap of bucketResults) {
    for (const [path, url] of bucketUrlMap) {
      urlMap.set(path, url);
    }
  }

  return urlMap;
}
