import ProjectCreatePage from '@/components/pages/ProjectCreatePage';

export default function NewProject() {
  return (
      <ProjectCreatePage
        postType="transaction"
        pageTitle="プロダクト投稿を作成"
        pageSubtitle="プロダクトの譲渡情報を入力してください"
      />
  );
}
