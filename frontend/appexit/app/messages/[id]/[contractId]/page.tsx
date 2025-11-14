import ContractDocumentPage from '@/components/pages/ContractDocumentPage';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
    contractId: string;
  }>;
}

export default function ContractDocument({ params }: PageProps) {
  const { id, contractId } = use(params);

  return (
    <ContractDocumentPage threadId={id} contractId={contractId} />
  );
}

