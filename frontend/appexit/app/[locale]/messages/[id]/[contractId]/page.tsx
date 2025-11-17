import ContractDocumentPage from '@/components/pages/ContractDocumentPage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{
    id: string;
    contractId: string;
    locale: Locale;
  }>;
}

export default async function ContractDocument({ params }: PageProps) {
  const { id, contractId, locale } = await params;
  const messagesDict = await loadPageDictionary(locale, 'messages');
  return <ContractDocumentPage threadId={id} contractId={contractId} pageDict={messagesDict} />;
}

