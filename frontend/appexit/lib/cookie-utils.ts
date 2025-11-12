/**
 * Cookie utility functions
 */

/**
 * Get a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Get the auth token from cookie
 * @deprecated HttpOnly Cookieに移行済みのため、この関数は使用されていません。
 * HttpOnly CookieはJavaScriptから読み取ることができません。
 * 認証はバックエンドのCookieで自動的に処理されます。
 * @returns Auth token or null if not found
 */
export function getAuthToken(): string | null {
  // HttpOnly Cookieに移行済みのため、この関数は常にnullを返します
  console.warn('[COOKIE-UTILS] getAuthToken() is deprecated. HttpOnly Cookie is used for authentication.');
  return null;
}

/**
 * Get Authorization header with Bearer token from cookie
 * @deprecated HttpOnly Cookieに移行済みのため、この関数は使用されていません。
 * HttpOnly CookieはJavaScriptから読み取ることができません。
 * 認証はバックエンドのCookieで自動的に処理されます。
 * @returns Authorization header object or empty object if token not found
 */
export function getAuthHeader(): { Authorization?: string } {
  // HttpOnly Cookieに移行済みのため、この関数は常に空のオブジェクトを返します
  console.warn('[COOKIE-UTILS] getAuthHeader() is deprecated. HttpOnly Cookie is used for authentication.');
  return {};
}
