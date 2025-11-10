'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Profile } from './auth-api';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshSession: async () => {},
  signOut: async () => {},
});

/**
 * API URLを取得
 */
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * バックエンドのCookieセッションをチェック
   * トークンの有効期限が近い場合は自動的にリフレッシュ
   */
  const checkBackendSession = async (): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();

      // Cookieからaccess_tokenを取得（Cookieベースのセッション管理）
      const accessTokenCookie = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('access_token='))
        : null;
      
      const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Cookieから取得したトークンをAuthorizationヘッダーに追加
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include', // HTTPOnly Cookieを送信
        cache: 'no-store',
        headers,
      });

      if (response.ok) {
        const result = await response.json();
        const sessionData = result.data;

        console.log('[AUTH-CONTEXT] Backend session found:', sessionData.email);
        
        // Cookieベースのセッション管理のため、Supabaseセッションの復元は不要
        // バックエンドセッションが有効であれば、Cookieからトークンを取得して使用する

        setUser({
          id: sessionData.id,
          email: sessionData.email,
          name: sessionData.name,
          created_at: sessionData.created_at || new Date().toISOString(),
          updated_at: sessionData.updated_at || new Date().toISOString(),
        });
        setProfile(sessionData.profile);

        return true;
      } else {
        console.log('[AUTH-CONTEXT] No backend session found');
        setUser(null);
        setProfile(null);
        return false;
      }
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error checking backend session:', error);
      setUser(null);
      setProfile(null);
      return false;
    }
  };

  /**
   * バックエンドのトークンをリフレッシュ
   * リフレッシュ後、新しいトークンでセッションを再確認
   */
  const refreshBackendToken = async (): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();
      
      // Cookieからaccess_tokenを取得（Cookieベースのセッション管理）
      const accessTokenCookie = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('access_token='))
        : null;
      
      const accessToken = accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
      
      if (!accessToken) {
        console.warn('[AUTH-CONTEXT] No access_token cookie available for backend refresh');
        return false;
      }

      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // refresh_token Cookieを送信
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        console.log('[AUTH-CONTEXT] ✓ Backend token refreshed successfully');
        // リフレッシュ成功（セッション再確認は呼び出し元で行う）
        return true;
      } else {
        const errorText = await response.text();
        console.error('[AUTH-CONTEXT] ❌ Backend token refresh failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error refreshing backend token:', error);
      return false;
    }
  };

  /**
   * セッションを手動でリフレッシュ
   * Cookieベースのセッション管理：バックエンドのリフレッシュエンドポイントを使用
   */
  const refreshSession = async () => {
    console.log('[AUTH-CONTEXT] Manually refreshing session...');

    // バックエンドのトークンをリフレッシュ（Cookieベース）
    try {
      const refreshed = await refreshBackendToken();
      if (refreshed) {
        console.log('[AUTH-CONTEXT] ✓ Backend token refreshed');
      } else {
        console.warn('[AUTH-CONTEXT] ⚠️ Backend token refresh failed');
      }
    } catch (err) {
      console.error('[AUTH-CONTEXT] Error refreshing backend token:', err);
    }

    // セッションを再確認
    await checkBackendSession();
  };

  /**
   * サインアウト
   */
  const signOut = async () => {
    console.log('[AUTH-CONTEXT] Starting sign out process...');

    // インターバルをクリア
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }

    // ステートを先にクリア
    setUser(null);
    setProfile(null);

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => {}); // 接続不能でも続行

      console.log('[AUTH-CONTEXT] Backend cookie cleared');
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error during sign out:', error);
    }

    console.log('[AUTH-CONTEXT] Sign out complete');
  };

  useEffect(() => {
    // 初期化時にバックエンドセッションをチェック
    console.log('[AUTH-CONTEXT] Initializing auth with backend session check...');

    checkBackendSession().then((hasSession) => {
      setLoading(false);

      if (hasSession) {
        // セッションチェックを30秒ごとに実行
        sessionCheckIntervalRef.current = setInterval(async () => {
          const stillValid = await checkBackendSession();
          if (!stillValid) {
            // セッションが無効になったらインターバルをクリア
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
              clearInterval(tokenRefreshIntervalRef.current);
              tokenRefreshIntervalRef.current = null;
            }
          }
        }, 30 * 1000); // 30秒ごと

        // トークンを積極的にリフレッシュ（10分ごと）
        // セッションを2日間維持するため、リフレッシュトークンが有効な限り自動リフレッシュ
        // Cookieベースのセッション管理：バックエンドのリフレッシュエンドポイントを使用
        tokenRefreshIntervalRef.current = setInterval(async () => {
          console.log('[AUTH-CONTEXT] Proactively refreshing tokens (10min interval) to maintain 2-day session...');
          try {
            // Cookieからaccess_tokenを取得
            const accessTokenCookie = typeof document !== 'undefined' 
              ? document.cookie.split('; ').find(row => row.startsWith('access_token='))
              : null;
            
            if (!accessTokenCookie) {
              console.warn('[AUTH-CONTEXT] No access_token cookie available for refresh');
              return;
            }

            const accessToken = accessTokenCookie.split('=')[1];
            
            // JWTトークンをデコードして有効期限を確認（簡易版）
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              const expiresAt = payload.exp * 1000; // ミリ秒に変換
              const now = Date.now();
              const timeUntilExpiry = expiresAt - now;
              const minutesUntilExpiry = Math.round(timeUntilExpiry / 1000 / 60);
              
              console.log(`[AUTH-CONTEXT] Current token expires in ${minutesUntilExpiry} minutes`);
              
              // 残り20分以下の場合にリフレッシュ（確実に期限切れ前にリフレッシュ）
              // リフレッシュトークンが有効な限り、セッションを2日間維持
              if (timeUntilExpiry < 20 * 60 * 1000 && timeUntilExpiry > 0) {
                console.log('[AUTH-CONTEXT] Refreshing tokens to maintain 2-day session...');
                
                // バックエンドのリフレッシュエンドポイントを使用（Cookieベース）
                const backendRefreshed = await refreshBackendToken();
                if (backendRefreshed) {
                  console.log('[AUTH-CONTEXT] ✓ Backend token refreshed proactively');
                  console.log('[AUTH-CONTEXT] Session will be maintained for 2 days via refresh token');
                } else {
                  console.error('[AUTH-CONTEXT] ❌ Backend token refresh failed, retrying...');
                  // リトライ（最大3回）
                  let retryCount = 0;
                  const maxRetries = 3;
                  while (retryCount < maxRetries && !backendRefreshed) {
                    retryCount++;
                    console.log(`[AUTH-CONTEXT] Retrying token refresh (attempt ${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
                    const retried = await refreshBackendToken();
                    if (retried) {
                      console.log('[AUTH-CONTEXT] ✓ Token refreshed after retry');
                      break;
                    }
                  }
                }
              } else {
                console.log(`[AUTH-CONTEXT] Token still valid for ${minutesUntilExpiry} minutes, will refresh when < 20 minutes`);
              }
            } catch (decodeError) {
              console.error('[AUTH-CONTEXT] Error decoding token:', decodeError);
              // デコードに失敗してもリフレッシュを試みる
              await refreshBackendToken();
            }
          } catch (err) {
            console.error('[AUTH-CONTEXT] ❌ Error refreshing tokens:', err);
            // エラーが発生しても次回のリフレッシュを試みる
          }
        }, 10 * 60 * 1000); // 10分ごと（セッションを2日間維持するため積極的にリフレッシュ）
      }
    });

    // ページがフォーカスされたときにセッションをチェック&トークンリフレッシュ
    const handleFocus = async () => {
      console.log('[AUTH-CONTEXT] Page focused, checking session and refreshing tokens...');
      await checkBackendSession();

      // フォーカス時にもトークンをリフレッシュ（長時間放置後の復帰対策）
      // Cookieベースのセッション管理：バックエンドのリフレッシュエンドポイントを使用
      try {
        const backendRefreshed = await refreshBackendToken();
        if (backendRefreshed) {
          console.log('[AUTH-CONTEXT] ✓ Backend token refreshed on focus');
        } else {
          console.warn('[AUTH-CONTEXT] ⚠️ Backend token refresh failed on focus');
        }
      } catch (err) {
        console.error('[AUTH-CONTEXT] Error refreshing tokens on focus:', err);
      }
    };
    window.addEventListener('focus', handleFocus);

    // クリーンアップ
    return () => {
      console.log('[AUTH-CONTEXT] Cleaning up auth context');
      window.removeEventListener('focus', handleFocus);
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshSession, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
