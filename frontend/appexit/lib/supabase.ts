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
    // HttpOnly Cookieはバックエンドが設定するため、フロントエンドでは何もしない
  });

  // Cookieベースのセッション管理のため、定期的なチェックは不要
  // セッションはバックエンドのCookieから復元される
}
