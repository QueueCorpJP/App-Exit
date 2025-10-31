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

    // クリーンアップ
    return () => {
      console.log('[AUTH-CONTEXT] Cleaning up auth listener');
      subscription.unsubscribe();
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

    try {
      // Supabaseからサインアウト（LocalStorageのセッションを削除）
      // 統一戦略: トークンはSupabase LocalStorageのみで管理
      await supabase.auth.signOut();
      console.log('[AUTH-CONTEXT] Supabase session cleared');
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error during sign out:', error);
    }

    // ステートをクリア
    setUser(null);
    setProfile(null);
    setToken(null);

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
