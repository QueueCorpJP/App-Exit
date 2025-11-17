'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Button from '@/components/ui/Button';

function SuccessContent() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams = useSearchParams();
  const saleRequestId = searchParams.get('sale_request_id');
  const paymentIntent = searchParams.get('payment_intent');
  const [countdown, setCountdown] = useState(5);
  const t = useTranslations('payment');

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/messages`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-sm border-2 max-w-md w-full text-center" style={{ borderColor: '#323232' }}>
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <svg
              className="w-12 h-12"
              style={{ color: '#10B981' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#323232' }}>
            {t('success.title')}
          </h2>
          <p className="text-gray-600">
            {t('success.message')}
          </p>
        </div>

        {paymentIntent && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{t('success.paymentId')}</p>
            <p className="text-sm font-mono text-gray-700 break-all">{paymentIntent}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push(`/${locale}/messages`)}
            style={{
              backgroundColor: '#E65D65',
              color: '#fff'
            }}
          >
            {t('success.backToMessages')}
          </Button>
          <p className="text-sm text-gray-500">
            {countdown}{t('success.countdown')}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {t('success.detailsNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#E65D65' }}></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
