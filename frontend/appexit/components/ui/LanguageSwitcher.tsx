'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { locales, type Locale } from '@/i18n/config';
import { updateUserLanguage } from '@/lib/locale-actions';

const languageNames: Record<string, string> = {
  ja: '日本語',
  en: 'English'
};

const languageFlags: Record<string, string> = {
  ja: '🇯🇵',
  en: '🇺🇸'
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = async (newLocale: string) => {
    if (isUpdating || newLocale === locale) return;

    setIsUpdating(true);

    try {
      // サーバーアクションで言語を更新（ログインユーザーの場合はプロフィールも更新）
      const result = await updateUserLanguage(newLocale as Locale);

      if (!result.success) {
        // Failed to update language - continue without update
        // フォールバック: Cookie のみ更新
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }

      // ロケールを含むパスから、新しいロケールのパスに変更
      const pathnameWithoutLocale = pathname.replace(/^\/(ja|en)/, '');
      const newPath = `/${newLocale}${pathnameWithoutLocale || ''}`;

      // ページ遷移
      router.push(newPath);
      router.refresh();
    } catch (error) {
      // Error switching language - continue without switch
      // フォールバック: Cookie のみ更新してリダイレクト
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      const pathnameWithoutLocale = pathname.replace(/^\/(ja|en)/, '');
      const newPath = `/${newLocale}${pathnameWithoutLocale || ''}`;
      router.push(newPath);
      router.refresh();
    } finally {
      setIsOpen(false);
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="言語を変更"
      >
        <span className="text-lg">{languageFlags[locale]}</span>
        <span className="hidden sm:inline">{languageNames[locale]}</span>
        {isUpdating ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLanguage(loc)}
              disabled={isUpdating || locale === loc}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 disabled:cursor-not-allowed ${
                locale === loc ? 'bg-gray-100 font-semibold' : ''
              }`}
            >
              <span className="text-lg">{languageFlags[loc]}</span>
              <span>{languageNames[loc]}</span>
              {locale === loc && (
                <svg className="w-4 h-4 ml-auto text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
