import PaymentCheckoutPage from '@/components/pages/PaymentCheckoutPage';
import type { Locale } from '@/i18n/config';

export default async function CheckoutPage({ params }: { params: Promise<{ appId: string; locale: Locale }> }) {
  const { appId } = await params;
  // PaymentCheckoutPageはクライアントコンポーネントでuseTranslations()を使用
  return <PaymentCheckoutPage appId={appId} />;
}
