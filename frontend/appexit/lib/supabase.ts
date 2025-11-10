import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

// Cookieベースのセッション管理用のカスタムストレージ
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find(row => row.startsWith(`${key}=`));
    return cookie ? cookie.split('=')[1] : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    // SupabaseセッションはCookieに保存しない（バックエンドが管理）
    // このストレージは使用しない
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // LocalStorageを使用しない（Cookieベースのセッション管理）
    autoRefreshToken: false, // 自動リフレッシュは無効（手動で管理）
    detectSessionInUrl: true,
    storage: cookieStorage, // カスタムストレージ（実際には使用しない）
  },
});

// トークンリフレッシュのイベントをリッスン
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    const now = new Date().toISOString();
    console.log(`[SUPABASE ${now}] Auth state changed:`, event);

    // セッション情報をデバッグ出力
    if (session) {
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
      const expiresIn = session.expires_in || 'unknown';
      console.log(`[SUPABASE ${now}] Session info:`, {
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token,
        expiresIn: `${expiresIn} seconds`,
        expiresAt,
        tokenLength: session.access_token?.length || 0
      });
    } else {
      console.log(`[SUPABASE ${now}] ⚠️ No session available`);
    }

    if (event === 'TOKEN_REFRESHED') {
      console.log(`[SUPABASE ${now}] ✓ Token refreshed successfully`);
      // リフレッシュされたトークンをCookieに保存
      // JWT有効期限（30分）に合わせてCookie有効期限も30分（1800秒）に設定
      if (session?.access_token) {
        document.cookie = `access_token=${session.access_token}; path=/; max-age=1800; SameSite=Lax`;
        console.log(`[SUPABASE ${now}] ✓ Updated access_token cookie (length: ${session.access_token.length})`);
      }
    }

    if (event === 'SIGNED_IN' && session?.access_token) {
      console.log(`[SUPABASE ${now}] ✓ User signed in, saving access_token to cookie`);
      // JWT有効期限（30分）に合わせてCookie有効期限も30分（1800秒）に設定
      document.cookie = `access_token=${session.access_token}; path=/; max-age=1800; SameSite=Lax`;
    }

    if (event === 'SIGNED_OUT') {
      console.log(`[SUPABASE ${now}] User signed out, clearing cookies`);
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });

  // Cookieベースのセッション管理のため、定期的なチェックは不要
  // セッションはバックエンドのCookieから復元される
}
