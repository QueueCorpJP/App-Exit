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
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const t = useTranslations('payment');

  // 🔒 SECURITY: 決済を検証してから成功ページを表示
  useEffect(() => {
    const verifyPayment = async () => {
      if (!saleRequestId || !paymentIntent) {
        setVerificationError('Missing payment information');
        setIsVerifying(false);
        return;
      }

      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setVerificationError('Authentication required');
          setIsVerifying(false);
          router.push(`/${locale}/login?redirect=/payment/success?sale_request_id=${saleRequestId}&payment_intent=${paymentIntent}`);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/sale-requests/verify?sale_request_id=${saleRequestId}&payment_intent=${paymentIntent}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          setVerificationError(error.error || 'Payment verification failed');
          setIsVerifying(false);
          return;
        }

        // 検証成功 - 成功ページを表示
        setIsVerifying(false);
      } catch (error) {
        // Payment verification error - continue without verification
        setVerificationError('Payment verification failed');
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [saleRequestId, paymentIntent, router, locale]);

  // カウントダウンタイマー（検証成功後のみ）
  useEffect(() => {
    if (isVerifying || verificationError) return;

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
  }, [router, locale, isVerifying, verificationError]);

  // 検証中の表示
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 max-w-md w-full text-center" style={{ borderColor: '#323232' }}>
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 mb-4" style={{ borderColor: '#E65D65' }}></div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#323232' }}>
            Verifying payment...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your payment
          </p>
        </div>
      </div>
    );
  }

  // 検証エラーの表示
  if (verificationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border-2 max-w-md w-full text-center" style={{ borderColor: '#323232' }}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <svg
              className="w-12 h-12"
              style={{ color: '#EF4444' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#323232' }}>
            Payment Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {verificationError}
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => router.push(`/${locale}/messages`)}
            style={{
              backgroundColor: '#E65D65',
              color: '#fff'
            }}
          >
            Back to Messages
          </Button>
        </div>
      </div>
    );
  }

  // 検証成功 - 成功ページを表示
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
