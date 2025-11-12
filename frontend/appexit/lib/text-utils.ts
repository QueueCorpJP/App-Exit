/**
 * テキストの文字制限と省略表示のユーティリティ関数
 */

/**
 * 指定された文字数で文字列を切り詰め、省略記号を追加する
 * @param text 元の文字列
 * @param maxLength 最大文字数
 * @param ellipsis 省略記号（デフォルト: "..."）
 * @returns 切り詰められた文字列
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + ellipsis;
}

/**
 * 表示名の文字制限を適用する
 * @param displayName 表示名
 * @param context 表示コンテキスト（ヘッダー、プロフィール、投稿など）
 * @returns 制限が適用された表示名
 */
export function truncateDisplayName(displayName: string, context: 'header' | 'profile' | 'post' | 'card' = 'profile'): string {
  if (!displayName) return '';
  
  const limits = {
    header: 15,    // ヘッダーでの表示
    profile: 20,   // プロフィール詳細での表示
    post: 12,      // 投稿一覧での表示
    card: 18       // プロフィールカードでの表示
  };
  
  return truncateText(displayName, limits[context]);
}
