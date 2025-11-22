import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request
  let locale = await requestLocale;

  // Validate that the incoming locale parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  // ⚡ パフォーマンス最適化: 頻繁に使用される翻訳のみをロード
  // 全ページまたは多くのページで使用される翻訳を並列読み込み
  const [
    commonFile,
    auth,
    errors,
    validation,
    projects,
    messages,
    home,
    transactions,
    categories,
    profile,
    filters,
    nda
  ] = await Promise.all([
    import(`../locales/${locale}/common.json`).then(m => m.default),
    import(`../locales/${locale}/auth.json`).then(m => m.default),
    import(`../locales/${locale}/errors.json`).then(m => m.default),
    import(`../locales/${locale}/validation.json`).then(m => m.default),
    import(`../locales/${locale}/projects.json`).then(m => m.default),
    import(`../locales/${locale}/messages.json`).then(m => m.default),
    import(`../locales/${locale}/home.json`).then(m => m.default),
    import(`../locales/${locale}/transactions.json`).then(m => m.default),
    import(`../locales/${locale}/categories.json`).then(m => m.default),
    import(`../locales/${locale}/profile.json`).then(m => m.default),
    import(`../locales/${locale}/filters.json`).then(m => m.default),
    import(`../locales/${locale}/nda.json`).then(m => m.default),
  ]);

  // 使用頻度の低い翻訳は各ページで遅延ロード
  // form など

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
      auth,
      errors,
      validation,
      projects,
      messages,
      home,
      transactions,
      categories,
      profile,
      filters,
      nda,
    }
  };
});
