import { supabase } from './supabase';

const STORAGE_BUCKET = 'post-images';
const AVATAR_BUCKET = 'avatars';

/**
 * Supabase Storageに画像をアップロードする
 * @param file アップロードする画像ファイル
 * @param userId アップロードするユーザーのID
 * @returns アップロードされた画像のパス
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
  // ファイル名を生成 (ユーザーID_タイムスタンプ_元のファイル名)
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${timestamp}.${fileExt}`;
  const filePath = `covers/${fileName}`;

  // Supabase Storageにアップロード
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Image upload error:', error);
    throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
  }

  console.log('Image uploaded successfully:', data.path);
  return data.path;
}

/**
 * Supabase Storageから画像の署名付きURLを取得する
 * @param path 画像のパス
 * @param expiresIn URL の有効期限（秒）デフォルトは1時間
 * @returns 署名付きURL
 */
export async function getImageUrl(path: string | null | undefined, expiresIn: number = 3600): Promise<string> {
  if (!path) {
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Failed to get signed URL:', error);
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  }

  return data.signedUrl;
}

/**
 * 複数の画像パスから署名付きURLを一括取得
 * @param paths 画像パスの配列
 * @param expiresIn URL の有効期限（秒）デフォルトは1時間
 * @returns パスとURLのマップ
 */
export async function getImageUrls(
  paths: (string | null | undefined)[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  const validPaths = paths.filter((p): p is string => !!p);

  console.log('[STORAGE] getImageUrls called with paths:', paths);
  console.log('[STORAGE] Valid paths count:', validPaths.length);

  if (validPaths.length === 0) {
    console.log('[STORAGE] No valid paths, returning empty map');
    return urlMap;
  }

  // 413エラー回避のため、バッチサイズを制限（最大10個ずつ）
  const BATCH_SIZE = 10;

  for (let i = 0; i < validPaths.length; i += BATCH_SIZE) {
    const batch = validPaths.slice(i, i + BATCH_SIZE);
    console.log(`[STORAGE] Processing batch ${i / BATCH_SIZE + 1}, paths:`, batch);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(batch, expiresIn);

    if (error) {
      console.error('[STORAGE] Failed to get signed URLs for batch:', error);
      console.error('[STORAGE] Error details:', JSON.stringify(error));
      continue; // エラーがあっても次のバッチを処理
    }

    console.log(`[STORAGE] Batch response:`, data);

    data.forEach((item) => {
      if (item.signedUrl && item.path) {
        console.log(`[STORAGE] ✓ Generated URL for: ${item.path}`);
        urlMap.set(item.path, item.signedUrl);
      } else {
        console.warn(`[STORAGE] ✗ No URL generated for: ${item.path}`, item);
      }
    });
  }

  console.log('[STORAGE] Final URL map size:', urlMap.size);
  return urlMap;
}

/**
 * Supabase Storageから画像を削除する
 * @param path 削除する画像のパス
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Image deletion error:', error);
    throw new Error(`画像の削除に失敗しました: ${error.message}`);
  }

  console.log('Image deleted successfully:', path);
}

/**
 * Supabase Storageにアバター画像をアップロードする
 * @param file アップロードする画像ファイル
 * @param userId アップロードするユーザーのID（オプション）
 * @returns 公開URLの文字列
 */
export async function uploadAvatarImage(file: File, userId?: string): Promise<string> {
  // ファイル名を生成 (タイムスタンプ_元のファイル名 または ユーザーID_タイムスタンプ)
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = userId 
    ? `${userId}_${timestamp}.${fileExt}`
    : `avatar_${timestamp}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Supabase Storageにアップロード
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Avatar upload error:', error);
    throw new Error(`アバター画像のアップロードに失敗しました: ${error.message}`);
  }

  // 公開URLを取得
  const { data: publicUrlData } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(data.path);

  console.log('Avatar uploaded successfully:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}
