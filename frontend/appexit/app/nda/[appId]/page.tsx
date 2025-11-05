import NDAPage from '@/components/pages/NDAPage';

export default function NDASign({ params }: { params: { appId: string } }) {
  return (
    <>
      <NDAPage appId={params.appId} sellerId="seller123" />
    </>
  );
}
