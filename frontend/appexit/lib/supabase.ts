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

  // 5分ごとにセッション状態をチェック（デバッグ用）
  setInterval(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    const now = new Date().toISOString();
    if (session) {
      const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown';
      const remainingSeconds = session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 0;
      console.log(`[SUPABASE ${now}] 🔍 Session check:`, {
        hasSession: true,
        expiresAt,
        remainingSeconds: `${remainingSeconds} seconds (${Math.floor(remainingSeconds / 60)} minutes)`,
        willExpireSoon: remainingSeconds < 600 // 10分以内
      });
    } else {
      console.log(`[SUPABASE ${now}] ⚠️ Session check: NO SESSION${error ? ` (error: ${error.message})` : ''}`);
    }
  }, 5 * 60 * 1000); // 5分ごと
}
