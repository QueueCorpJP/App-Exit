'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Button from '@/components/ui/Button';

// Stripeの公開可能キーを設定（環境変数から取得）
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
  clientSecret: string;
  saleRequestId: string;
}

function CheckoutForm({ clientSecret, saleRequestId }: CheckoutFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?sale_request_id=${saleRequestId}`,
        },
      });

      if (submitError) {
        setError(submitError.message || t('paymentFailed'));
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || t('paymentFailed'));
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border-2" style={{ borderColor: '#323232' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>
          {t('stripeCheckoutPaymentInfo')}
        </h2>
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={processing}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={!stripe || processing}
          isLoading={processing}
          loadingText={t('processing')}
          style={{
            backgroundColor: '#E65D65',
            color: '#fff'
          }}
        >
          {t('stripeCheckoutConfirm')}
        </Button>
      </div>
    </form>
  );
}

interface StripeWrapperProps {
  clientSecret: string;
  saleRequestId: string;
}

export default function StripeCheckoutWrapper({ clientSecret, saleRequestId }: StripeWrapperProps) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#E65D65',
        colorBackground: '#ffffff',
        colorText: '#323232',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm clientSecret={clientSecret} saleRequestId={saleRequestId} />
    </Elements>
  );
}
