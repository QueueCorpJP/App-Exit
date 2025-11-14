import PaymentCheckoutPage from '@/components/pages/PaymentCheckoutPage';
import { use } from 'react';

export default function CheckoutPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  
  return (
    <>
      <PaymentCheckoutPage appId={appId} />
    </>
  );
}
