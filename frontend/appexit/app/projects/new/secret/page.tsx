import ProjectCreatePage from '@/components/pages/ProjectCreatePage';

export default function NewSecretProject() {
  return (
      <ProjectCreatePage
        postType="secret"
        pageTitle="シークレット投稿を作成"
        pageSubtitle="シークレット情報の投稿を作成してください"
      />
  );
}
