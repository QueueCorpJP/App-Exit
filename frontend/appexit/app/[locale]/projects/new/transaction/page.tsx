import ProjectCreatePage from '@/components/pages/ProjectCreatePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function NewProject({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const projectsDict = await loadPageDictionary(locale, 'projects');
  const tp = createPageDictHelper(projectsDict);

  return (
      <ProjectCreatePage
        postType="transaction"
        pageTitle={tp('create.transaction.title')}
        pageSubtitle={tp('create.transaction.subtitle')}
      />
  );
}
