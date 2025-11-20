'use server';

import { cookies } from 'next/headers';
import { type Locale, locales } from '@/i18n/config';

/**
 * サーバーサイドでSupabaseクライアントを作成
 */
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * ユーザーの言語設定を更新する（サーバーアクション）
 */
export async function updateUserLanguage(newLocale: Locale): Promise<{ success: boolean; error?: string }> {
  try {
    // 有効なlocaleかチェック
    if (!locales.includes(newLocale)) {
      return { success: false, error: 'Invalid locale' };
    }

    const supabase = await getSupabaseClient();
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      // 未ログインユーザー: Cookie のみ更新
      cookieStore.set('NEXT_LOCALE', newLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      });
      return { success: true };
    }

    // ログインユーザー: プロフィールを更新
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return { success: false, error: 'Authentication failed' };
    }

    // Supabase RPC を使って言語を更新（関数が存在する場合）
    const { error: rpcError } = await supabase.rpc('update_user_language', {
      new_lang: newLocale
    });

    if (rpcError) {
      // RPC 関数が存在しない場合は直接更新
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ lang: newLocale })
        .eq('id', user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }
    }

    // Cookie も更新
    cookieStore.set('NEXT_LOCALE', newLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365
    });

    return { success: true };
  } catch (error) {
    // Error updating user language - continue without update
    return { success: false, error: 'Unknown error' };
  }
}
