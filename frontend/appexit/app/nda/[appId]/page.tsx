import NDAPage from '@/components/pages/NDAPage';
import { use } from 'react';

export default function NDASign({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  
  return (
    <>
      <NDAPage appId={appId} sellerId="seller123" />
    </>
  );
}
