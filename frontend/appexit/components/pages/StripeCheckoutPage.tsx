'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';

// Stripeコンポーネントを動的インポート
const StripeWrapper = dynamic(
  () => import('./StripeCheckoutWrapper'),
  {
    loading: () => (
      <div className="flex justify-center p-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E65D65' }}></div>
      </div>
    ),
    ssr: false
  }
);

export default function StripeCheckoutPage() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('client_secret');
  const saleRequestId = searchParams.get('sale_request_id');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret || !saleRequestId) {
      setError(t('stripeCheckoutNotFound'));
    }
  }, [clientSecret, saleRequestId, t]);

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
                  d="M12 8v4m0 4h.01M21 12a9 9 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#323232' }}>
              {t('error')}
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
              {t('contractBackToMessages')}
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#323232' }}>
            {t('stripeCheckoutTitle')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('stripeCheckoutSubtitle')}
          </p>
        </div>

        <StripeWrapper clientSecret={clientSecret} saleRequestId={saleRequestId} />

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>{t('stripeCheckoutSecure')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
