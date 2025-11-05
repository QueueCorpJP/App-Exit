'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Profile } from './auth-api';

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

  /**
   * バックエンドのCookieセッションをチェック
   */
  const checkBackendSession = async (): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include', // HTTPOnly Cookieを送信
        cache: 'no-store',
      });

      if (response.ok) {
        const result = await response.json();
        const sessionData = result.data;

        console.log('[AUTH-CONTEXT] Backend session found:', sessionData.email);

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
   * セッションを手動でリフレッシュ
   */
  const refreshSession = async () => {
    console.log('[AUTH-CONTEXT] Manually refreshing session...');
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

      // セッションがある場合、定期的なチェックを開始（30秒ごと）
      // ポーリング間隔を短くしてレスポンシブに
      if (hasSession) {
        sessionCheckIntervalRef.current = setInterval(async () => {
          const stillValid = await checkBackendSession();
          if (!stillValid) {
            // セッションが無効になったらインターバルをクリア
            if (sessionCheckIntervalRef.current) {
              clearInterval(sessionCheckIntervalRef.current);
              sessionCheckIntervalRef.current = null;
            }
          }
        }, 30 * 1000); // 30秒ごと
      }
    });

    // ページがフォーカスされたときにセッションをチェック
    const handleFocus = () => {
      console.log('[AUTH-CONTEXT] Page focused, checking session...');
      checkBackendSession();
    };
    window.addEventListener('focus', handleFocus);

    // クリーンアップ
    return () => {
      console.log('[AUTH-CONTEXT] Cleaning up auth context');
      window.removeEventListener('focus', handleFocus);
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
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
