import { cookies } from 'next/headers';
import { defaultLocale, type Locale, locales } from '@/i18n/config';
import { unstable_cache } from 'next/cache';

/**
 * サーバーサイドでSupabaseクライアントを作成
 */
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Supabase profiles テーブルからlocaleを取得する（内部実装）
 */
async function getLocaleFromProfileInternal(userId: string): Promise<Locale | null> {
  try {
    const supabase = await getSupabaseClient();

    // profiles テーブルから lang を取得
    const { data, error } = await supabase
      .from('profiles')
      .select('lang')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    const lang = data.lang as string;

    // 有効なlocaleかチェック
    if (lang && locales.includes(lang as Locale)) {
      return lang as Locale;
    }

    return null;
  } catch (error) {
    // Error getting locale from profile - use default
    return null;
  }
}

/**
 * Supabase profiles テーブルからlocaleを取得する（キャッシュ付き）
 */
export async function getLocaleFromProfile(): Promise<Locale | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) return null;

    const supabase = await getSupabaseClient();

    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      return null;
    }

    // キャッシュ付きでlocaleを取得（1時間キャッシュ）
    const getCachedLocale = unstable_cache(
      async (userId: string) => getLocaleFromProfileInternal(userId),
      ['user-locale', user.id],
      { revalidate: 3600, tags: [`user-locale-${user.id}`] }
    );

    return await getCachedLocale(user.id);
  } catch (error) {
    // Error getting locale from profile - use default
    return null;
  }
}

/**
 * ProfileのlocaleをCookieに同期する
 * middleware が参照する NEXT_LOCALE Cookie にセット
 */
export async function syncLocaleCookie(): Promise<void> {
  try {
    const locale = await getLocaleFromProfile();

    if (locale) {
      const cookieStore = await cookies();
      cookieStore.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365 // 1年
      });
    }
  } catch (error) {
    // Error syncing locale cookie - continue without sync
  }
}

/**
 * ブラウザ側でlocaleを変更する
 */
export async function setLocale(locale: Locale): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1年
    });
  } catch (error) {
    // Error setting locale - continue without setting
  }
}

/**
 * Cookieからlocaleを取得する
 */
export async function getLocaleFromCookie(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value;

    if (locale && locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  } catch (error) {
    // Error getting locale from cookie - use default
  }

  return defaultLocale;
}
