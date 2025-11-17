import PaymentSettingsPage from '@/components/pages/PaymentSettingsPage';
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function PaymentSettings({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const paymentDict = await loadPageDictionary(locale, 'payment');
  return <PaymentSettingsPage pageDict={paymentDict} locale={locale} />;
}

