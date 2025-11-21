'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Profile, getApiUrl } from './auth-api';
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

// getApiUrl は auth-api.ts からインポート

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * バックエンドのCookieセッションをチェック
   */
  const checkBackendSession = async (attemptedRefresh: boolean = false): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        // 認証状態は常に最新を取得（ログイン直後やリフレッシュ直後の反映遅延を防止）
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const sessionData = result.data;

        setUser({
          id: sessionData.id,
          email: sessionData.email,
          name: sessionData.name,
          created_at: sessionData.created_at || new Date().toISOString(),
          updated_at: sessionData.updated_at || new Date().toISOString(),
        });
        setProfile(sessionData.profile);

        return true;
      } else if (response.status === 401) {
        // 401のときは、まずトークンリフレッシュを試行してから再確認（UIの一時的な未ログイン化を防ぐ）
        if (!attemptedRefresh) {
          const refreshed = await refreshBackendToken();
          if (refreshed) {
            return await checkBackendSession(true);
          }
        }
        setUser(null);
        setProfile(null);
        
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        return false;
      } else {
        setUser(null);
        setProfile(null);
        return false;
      }
    } catch (error) {
      // ネットワーク誤判定時の揺れを避けるため、未試行なら一度だけリフレッシュ→再確認
      if (!attemptedRefresh) {
        const refreshed = await refreshBackendToken();
        if (refreshed) {
          return await checkBackendSession(true);
        }
      }
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

      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        // トークンリフレッシュは常に最新を取得
        cache: 'no-store',
      });

      if (response.ok) {
        return true;
      } else if (response.status === 401) {
        const errorText = await response.text();
        
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        return false;
      } else {
        const errorText = await response.text();
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const refreshSession = async () => {
    try {
      const refreshed = await refreshBackendToken();
    } catch (err) {
    }

    await checkBackendSession();
  };

  /**
   * サインアウト
   */
  const signOut = async () => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }

    setUser(null);
    setProfile(null);

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        // ログアウトは常に最新を取得
        cache: 'no-store',
      }).catch(() => {});
    } catch (error) {
    }
  };

  useEffect(() => {
    checkBackendSession().then((hasSession) => {
      setLoading(false);

      if (hasSession) {
        // セッションチェック間隔を30秒から5分に延長（パフォーマンス改善）
        sessionCheckIntervalRef.current = setInterval(async () => {
          const stillValid = await checkBackendSession();
          if (!stillValid) {
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
              clearInterval(tokenRefreshIntervalRef.current);
              tokenRefreshIntervalRef.current = null;
            }
          }
        }, 5 * 60 * 1000); // 5分間隔

        // トークンリフレッシュ間隔を10分から30分に延長（パフォーマンス改善）
        tokenRefreshIntervalRef.current = setInterval(async () => {
          try {
            const backendRefreshed = await refreshBackendToken();
            if (backendRefreshed) {
            } else {
              const stillValid = await checkBackendSession();
              if (!stillValid) {
                if (sessionCheckIntervalRef.current) {
                  clearInterval(sessionCheckIntervalRef.current);
                  sessionCheckIntervalRef.current = null;
                }
                if (tokenRefreshIntervalRef.current) {
                  clearInterval(tokenRefreshIntervalRef.current);
                  tokenRefreshIntervalRef.current = null;
                }
                return;
              }
              
              let retryCount = 0;
              const maxRetries = 2; // リトライ回数を3回から2回に削減
              let retrySuccess = false;
              while (retryCount < maxRetries && !retrySuccess) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                const retried = await refreshBackendToken();
                if (retried) {
                  retrySuccess = true;
                }
              }
              
              if (!retrySuccess) {
                await checkBackendSession();
              }
            }
          } catch (err) {
          }
        }, 30 * 60 * 1000); // 30分間隔
      }
    });

    // フォーカス時のチェックを削除（パフォーマンス改善）
    // 定期的なチェックとトークンリフレッシュで十分

    return () => {
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
