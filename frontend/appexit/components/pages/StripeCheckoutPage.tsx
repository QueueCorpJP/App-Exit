'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
        setError(submitError.message || '決済に失敗しました');
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || '決済に失敗しました');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border-2" style={{ borderColor: '#323232' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#323232' }}>
          お支払い情報
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
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={!stripe || processing}
          isLoading={processing}
          loadingText="処理中..."
          style={{
            backgroundColor: '#E65D65',
            color: '#fff'
          }}
        >
          支払いを確定
        </Button>
      </div>
    </form>
  );
}

export default function StripeCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('client_secret');
  const saleRequestId = searchParams.get('sale_request_id');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret || !saleRequestId) {
      setError('決済情報が見つかりません');
    }
  }, [clientSecret, saleRequestId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 max-w-md w-full" style={{ borderColor: '#323232' }}>
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                style={{ color: '#E65D65' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#323232' }}>
              エラー
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={() => router.push('/messages')}
              style={{
                backgroundColor: '#E65D65',
                color: '#fff'
              }}
            >
              メッセージに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret || !saleRequestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E65D65' }}></div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#323232' }}>
            お支払い
          </h1>
          <p className="mt-2 text-gray-600">
            以下の情報を入力して、お支払いを完了してください
          </p>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm clientSecret={clientSecret} saleRequestId={saleRequestId} />
        </Elements>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>安全な決済は Stripe によって処理されます</span>
          </div>
        </div>
      </div>
    </div>
  );
}
