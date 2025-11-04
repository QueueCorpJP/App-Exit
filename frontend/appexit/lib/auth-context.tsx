'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Profile } from './auth-api';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User, profile: Profile | null, token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  loading: true,
  setAuth: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * トークンの有効期限をチェック
   */
  const isTokenExpired = (expiresAt: number | undefined): boolean => {
    if (!expiresAt) return false;
    // 有効期限の5分前から期限切れとみなす（マージンを持たせる）
    const margin = 5 * 60 * 1000; // 5分（ミリ秒）
    const now = Date.now();
    return expiresAt * 1000 - margin < now;
  };

  /**
   * セッションを更新
   */
  const updateSession = async (session: any) => {
    if (session && session.user) {
      console.log('[AUTH-CONTEXT] Setting user from session:', session.user.email);

      // トークンの有効期限をチェック
      if (isTokenExpired(session.expires_at)) {
        console.log('[AUTH-CONTEXT] Token expired, attempting refresh...');
        const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedData.session) {
          console.error('[AUTH-CONTEXT] Failed to refresh session:', refreshError);
          // セッションが無効になった場合、クリアする
          setUser(null);
          setProfile(null);
          setToken(null);
          return;
        }
        
        // リフレッシュ後のセッションを使用
        session = refreshedData.session;
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email || '',
        created_at: session.user.created_at,
        updated_at: session.user.updated_at || session.user.created_at,
      });
      setToken(session.access_token);

      // プロフィール情報をバックエンドAPI経由で取得
      try {
        // Dynamic import to avoid circular dependency
        const { profileApi } = await import('./api-client');
        const response = await profileApi.getProfile();

        if (response.success && response.data) {
          setProfile(response.data);
          console.log('[AUTH-CONTEXT] Profile loaded');
        }
      } catch (e) {
        console.log('[AUTH-CONTEXT] No profile found or error:', e);
      }
    } else {
      console.log('[AUTH-CONTEXT] No session found');
      setUser(null);
      setProfile(null);
      setToken(null);
    }
  };

  /**
   * セッションの状態を定期的にチェック
   */
  const startSessionCheck = () => {
    // 既存のインターバルをクリア
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // 5分ごとにセッションをチェック
    sessionCheckIntervalRef.current = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AUTH-CONTEXT] Error checking session:', error);
          return;
        }

        if (session) {
          // トークンの有効期限をチェック
          if (isTokenExpired(session.expires_at)) {
            console.log('[AUTH-CONTEXT] Token expiring soon, refreshing...');
            const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshedData.session) {
              console.error('[AUTH-CONTEXT] Failed to refresh session in interval:', refreshError);
              // セッションが無効になった場合、クリアする
              setUser(null);
              setProfile(null);
              setToken(null);
              return;
            }
            
            // リフレッシュ後のセッションで更新
            await updateSession(refreshedData.session);
          }
        } else {
          // セッションがない場合、ステートをクリア
          setUser(null);
          setProfile(null);
          setToken(null);
        }
      } catch (error) {
        console.error('[AUTH-CONTEXT] Error in session check interval:', error);
      }
    }, 5 * 60 * 1000); // 5分ごと
  };

  useEffect(() => {
    let isInitialized = false;
    let timeoutId: NodeJS.Timeout;

    // Supabaseの認証状態変更を監視
    console.log('[AUTH-CONTEXT] Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH-CONTEXT] Auth state changed:', event, session?.user?.email);

      // 初回の INITIAL_SESSION イベントで初期化
      if (event === 'INITIAL_SESSION') {
        console.log('[AUTH-CONTEXT] Initializing auth from INITIAL_SESSION');
        await updateSession(session);
        setLoading(false);
        isInitialized = true;

        // タイムアウトをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // セッションがある場合、定期的なチェックを開始
        if (session) {
          startSessionCheck();
        }
        return;
      }

      // まだ初期化されていない場合でも、他の認証イベントを処理
      if (!isInitialized) {
        console.log('[AUTH-CONTEXT] Initializing auth from event:', event);
        await updateSession(session);
        setLoading(false);
        isInitialized = true;

        // タイムアウトをクリア
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // セッションがある場合、定期的なチェックを開始
        if (session) {
          startSessionCheck();
        }
        return;
      }

      // 初期化後の認証イベント（SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED など）
      if (isInitialized) {
        await updateSession(session);

        // セッションが有効な場合、定期的なチェックを開始
        if (session) {
          startSessionCheck();
        } else {
          // セッションがない場合、インターバルをクリア
          if (sessionCheckIntervalRef.current) {
            clearInterval(sessionCheckIntervalRef.current);
            sessionCheckIntervalRef.current = null;
          }
        }
      }
    });

    // フォールバック: 3秒経過してもイベントが発火しない場合、強制的に初期化
    timeoutId = setTimeout(async () => {
      if (!isInitialized) {
        console.log('[AUTH-CONTEXT] Timeout: Forcing initialization');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          await updateSession(session);
        } catch (error) {
          console.error('[AUTH-CONTEXT] Error in fallback initialization:', error);
        } finally {
          setLoading(false);
          isInitialized = true;
        }
      }
    }, 3000);

    // クリーンアップ
    return () => {
      console.log('[AUTH-CONTEXT] Cleaning up auth listener');
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, []);

  const setAuth = (newUser: User, newProfile: Profile | null, newToken: string) => {
    setUser(newUser);
    setProfile(newProfile);
    setToken(newToken);
  };

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
    setToken(null);

    try {
      // 1) バックエンドのHttpOnly Cookie(auth_token等)を確実に削除
      const apiUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || `${window.location.protocol}//${window.location.hostname}:8080`)
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      }).catch(() => {}); // 接続不能でも続行（クッキーがない環境など）

      // 2) Supabaseからサインアウト（LocalStorageのセッションを削除）
      // scope: 'global'を使用してすべてのセッションをクリア
      await supabase.auth.signOut({ scope: 'global' }).catch((error) => {
        console.warn('[AUTH-CONTEXT] Supabase signOut error (continuing):', error);
      });

      // 3) LocalStorageから明示的にSupabaseのキーを削除
      if (typeof window !== 'undefined') {
        const supabaseKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('sb-') || key.includes('supabase')
        );
        supabaseKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log('[AUTH-CONTEXT] Removed localStorage key:', key);
        });
      }

      console.log('[AUTH-CONTEXT] Backend cookie cleared and Supabase session cleared');
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error during sign out:', error);
    }

    console.log('[AUTH-CONTEXT] Sign out complete');
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, setAuth, signOut }}>
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
