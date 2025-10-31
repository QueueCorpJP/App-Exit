import BoardDetailPage from '@/components/pages/BoardDetailPage';

export default function BoardDetail({ params }: { params: { id: string } }) {
  return (
    <>
      <BoardDetailPage postId={params.id} />
    </>
  );
}
