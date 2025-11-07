import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Supabaseがセッションを管理（LocalStorageを使用）
    autoRefreshToken: true, // 自動でトークンをリフレッシュ
    detectSessionInUrl: true,
    storageKey: 'appexit-auth', // セッションストレージのキー
    // トークンの有効期限が切れる前にリフレッシュする（デフォルトは60秒前）
    // より積極的にリフレッシュするために300秒（5分）前に設定
  },
});

// トークンリフレッシュのイベントをリッスン
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[SUPABASE] Auth state changed:', event);

    if (event === 'TOKEN_REFRESHED') {
      console.log('[SUPABASE] ✓ Token refreshed successfully');
      // リフレッシュされたトークンをCookieに保存
      if (session?.access_token) {
        document.cookie = `access_token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        console.log('[SUPABASE] ✓ Updated access_token cookie');
      }
    }

    if (event === 'SIGNED_IN' && session?.access_token) {
      console.log('[SUPABASE] ✓ User signed in, saving access_token to cookie');
      document.cookie = `access_token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
    }

    if (event === 'SIGNED_OUT') {
      console.log('[SUPABASE] User signed out, clearing cookies');
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  });
}
