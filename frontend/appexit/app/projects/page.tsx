import { Suspense } from 'react';
import ProjectsListPage from '@/components/pages/ProjectsListPage';

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectsListPage />
    </Suspense>
  );
}
