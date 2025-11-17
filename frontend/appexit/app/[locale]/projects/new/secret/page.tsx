import ProjectCreatePage from '@/components/pages/ProjectCreatePage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function NewSecretProject({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const projectsDict = await loadPageDictionary(locale, 'projects');
  const tp = createPageDictHelper(projectsDict);

  return (
      <ProjectCreatePage
        postType="secret"
        pageTitle={tp('create.secret.title')}
        pageSubtitle={tp('create.secret.subtitle')}
      />
  );
}
