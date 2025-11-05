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
 * @returns Auth token or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    console.warn('[COOKIE-UTILS] Running on server side, document is undefined');
    return null;
  }

  // デバッグ: すべてのCookieを表示
  console.log('[COOKIE-UTILS] All cookies:', document.cookie);

  // access_token（JavaScriptアクセス可能）を優先的に取得
  const token = getCookie('access_token');

  if (!token) {
    console.warn('[COOKIE-UTILS] access_token not found in cookies');
    // すべてのCookie名を表示
    const cookieNames = document.cookie.split(';').map(c => c.trim().split('=')[0]);
    console.log('[COOKIE-UTILS] Available cookie names:', cookieNames);
  } else {
    console.log('[COOKIE-UTILS] access_token found, length:', token.length);
  }

  return token;
}

/**
 * Get Authorization header with Bearer token from cookie
 * @returns Authorization header object or empty object if token not found
 */
export function getAuthHeader(): { Authorization?: string } {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}
