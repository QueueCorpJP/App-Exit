'use client';

import { Suspense } from 'react';
import StripeCheckoutPage from '@/components/pages/StripeCheckoutPage';
import { useTranslations } from 'next-intl';

function CheckoutContent() {
  const t = useTranslations('common');
  return <StripeCheckoutPage />;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E65D65' }}></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
