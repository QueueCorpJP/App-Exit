import TransactionHistoryPage from '@/components/pages/TransactionHistoryPage';
import type { Locale } from '@/i18n/config';

export default async function TransactionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  return <TransactionHistoryPage />;
}
