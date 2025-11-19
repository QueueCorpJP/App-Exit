import ProjectCreatePage from '@/components/pages/ProjectCreatePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function NewProject({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  // ページ固有の翻訳を並列取得
  const [projectsDict, formDict] = await Promise.all([
    loadPageDictionary(locale, 'projects'),
    loadPageDictionary(locale, 'form'),
  ]);

  const tp = createPageDictHelper(projectsDict);

  return (
      <ProjectCreatePage
        postType="transaction"
        pageTitle={tp('create.transaction.title')}
        pageSubtitle={tp('create.transaction.subtitle')}
        pageDict={{ form: formDict }}
      />
  );
}
