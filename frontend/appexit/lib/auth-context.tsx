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
   */
  const checkBackendSession = async (): Promise<boolean> => {
    try {
      const apiUrl = getApiUrl();

      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else if (response.status === 401) {
        console.log('[AUTH-CONTEXT] 401 Unauthorized - session expired, clearing local state');
        setUser(null);
        setProfile(null);
        
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        return false;
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

      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        console.log('[AUTH-CONTEXT] ✓ Backend token refreshed successfully');
        return true;
      } else if (response.status === 401) {
        const errorText = await response.text();
        console.error('[AUTH-CONTEXT] ❌ Refresh token expired (401):', errorText);
        
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        return false;
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

  const refreshSession = async () => {
    console.log('[AUTH-CONTEXT] Manually refreshing session...');

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

    await checkBackendSession();
  };

  /**
   * サインアウト
   */
  const signOut = async () => {
    console.log('[AUTH-CONTEXT] Starting sign out process...');

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
        cache: 'no-store',
      }).catch(() => {});

      console.log('[AUTH-CONTEXT] Backend cookie cleared');
    } catch (error) {
      console.error('[AUTH-CONTEXT] Error during sign out:', error);
    }

    console.log('[AUTH-CONTEXT] Sign out complete');
  };

  useEffect(() => {
    console.log('[AUTH-CONTEXT] Initializing auth with backend session check...');

    checkBackendSession().then((hasSession) => {
      setLoading(false);

      if (hasSession) {
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
        }, 30 * 1000);

        tokenRefreshIntervalRef.current = setInterval(async () => {
          console.log('[AUTH-CONTEXT] Proactively refreshing tokens (10min interval) to maintain 2-day session...');
          try {
            const backendRefreshed = await refreshBackendToken();
            if (backendRefreshed) {
              console.log('[AUTH-CONTEXT] ✓ Backend token refreshed proactively');
              console.log('[AUTH-CONTEXT] Session will be maintained for 2 days via refresh token');
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
              
              console.error('[AUTH-CONTEXT] ❌ Backend token refresh failed, retrying...');
              let retryCount = 0;
              const maxRetries = 3;
              let retrySuccess = false;
              while (retryCount < maxRetries && !retrySuccess) {
                retryCount++;
                console.log(`[AUTH-CONTEXT] Retrying token refresh (attempt ${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const retried = await refreshBackendToken();
                if (retried) {
                  console.log('[AUTH-CONTEXT] ✓ Token refreshed after retry');
                  retrySuccess = true;
                }
              }
              
              if (!retrySuccess) {
                await checkBackendSession();
              }
            }
          } catch (err) {
            console.error('[AUTH-CONTEXT] ❌ Error refreshing tokens:', err);
          }
        }, 10 * 60 * 1000);
      }
    });

    const handleFocus = async () => {
      console.log('[AUTH-CONTEXT] Page focused, checking session and refreshing tokens...');
      await checkBackendSession();

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
