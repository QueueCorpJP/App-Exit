import { Suspense } from 'react';
import ProjectsListPage from '@/components/pages/ProjectsListPage';
import type { Locale } from '@/i18n/config';

export default async function ProjectsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsListPage />
    </Suspense>
  );
}
