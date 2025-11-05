import PaymentCheckoutPage from '@/components/pages/PaymentCheckoutPage';

export default function CheckoutPage({ params }: { params: { appId: string } }) {
  return (
    <>
      <PaymentCheckoutPage appId={params.appId} />
    </>
  );
}
