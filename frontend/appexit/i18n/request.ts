import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request
  let locale = await requestLocale;

  // Validate that the incoming locale parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // ⚡ パフォーマンス改善: 必要最小限の翻訳のみ並列読み込み
  // 全ページで必要な翻訳のみをPromise.allで並列読み込み
  const [
    commonFile,
    projects,
    form,
    categories,
    filters,
    auth,
    home,
    messages,
    errors,
    validation,
    transactions
  ] = await Promise.all([
    import(`../locales/${locale}/common.json`).then(m => m.default),
    import(`../locales/${locale}/projects.json`).then(m => m.default),
    import(`../locales/${locale}/form.json`).then(m => m.default),
    import(`../locales/${locale}/categories.json`).then(m => m.default),
    import(`../locales/${locale}/filters.json`).then(m => m.default),
    import(`../locales/${locale}/auth.json`).then(m => m.default),
    import(`../locales/${locale}/home.json`).then(m => m.default),
    import(`../locales/${locale}/messages.json`).then(m => m.default),
    import(`../locales/${locale}/errors.json`).then(m => m.default),
    import(`../locales/${locale}/validation.json`).then(m => m.default),
    import(`../locales/${locale}/transactions.json`).then(m => m.default),
  ]);

  // その他のページ固有翻訳は遅延読み込み（使用時のみロード）
  // ページコンポーネント内で個別にuseTranslations()を呼ぶ際に動的ロード

  return {
    locale,
    messages: {
      // Spread the common.common namespace to root level for direct access
      ...commonFile.common,
      // Keep nested namespaces
      header: commonFile.header,
      footer: commonFile.footer,
      common: commonFile.common,
      metadata: commonFile.metadata,
      projects,
      form,
      categories,
      filters,
      auth,
      home,
      messages,
      errors,
      validation,
      transactions,
      // 以下は必要に応じて追加（初期ロードには含めない）
      // nda, payment, profile, settings, board,
      // faq, about, checkout, dashboard, help, legal, notifications,
      // reviews, search, analytics, contact, customerHarassment,
      // report, safety, seminar, support, supportService
    }
  };
});
