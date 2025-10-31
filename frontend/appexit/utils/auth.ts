/**
 * Cookieからトークンを取得
 * @returns トークンまたはnull
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * トークンを取得して検証する（Cookieから）
 * @returns 有効なトークンまたはnull
 */
export function getValidToken(): string | null {
  const token = getCookie('auth_token');

  if (!token) {
    return null;
  }

  // JWTトークンは3つのセグメント（header.payload.signature）を持つべき
  if (token.split('.').length !== 3) {
    // 無効なトークン形式 - クリア
    clearAuth();
    return null;
  }

  return token;
}

/**
 * 認証情報をすべてクリアする
 */
export function clearAuth(): void {
  if (typeof document === 'undefined') return;

  // すべてのCookieをクリア
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name] = cookie.split('=');
    const cookieName = name.trim();
    // すべてのパスとドメインでクッキーを削除
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    if (typeof window !== 'undefined') {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    }
  }

  // ローカルストレージとセッションストレージもクリア（念のため、過去のデータを削除）
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
}

/**
 * ログインしているかチェック
 * @returns ログイン状態
 */
export function isAuthenticated(): boolean {
  return getValidToken() !== null;
}
