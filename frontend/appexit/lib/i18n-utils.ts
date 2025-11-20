import type { Locale } from '@/i18n/config';

/**
 * ページ単位で動的に辞書をロードする関数（軽量版）
 * Next.jsのdynamic importを使用して、必要な辞書のみを自動チャンク分割
 *
 * 注意: next-intlが既にcommon.jsonをロードしているため、
 * この関数は追加の翻訳が必要な場合のみ使用してください
 */
export async function loadPageDictionary(
  locale: Locale,
  page: string
): Promise<Record<string, any>> {
  try {
    const dict = await import(`@/locales/${locale}/${page}.json`);
    return dict.default || dict;
  } catch (error) {
    // Dictionary not found - use empty dictionary
    return {};
  }
}
