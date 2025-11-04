'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface AppDetails {
  id: string
  title: string
  description: string
  price: number
  seller_name: string
  seller_id: string
  images: string[]
}

interface PaymentCheckoutPageProps {
  appId: string
}

export default function PaymentCheckoutPage({ appId }: PaymentCheckoutPageProps) {
  const [app, setApp] = useState<AppDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const [termsAccepted, setTermsAccepted] = useState(false)
  const [transferAccepted, setTransferAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // TODO: APIからプロダクト詳細を取得
    // 仮のデータ
    const mockApp: AppDetails = {
      id: appId,
      title: 'ECサイトプロダクト',
      description: '月間売上100万円のECサイト',
      price: 5000000,
      seller_name: '山田太郎',
      seller_id: 'seller123',
      images: [''],
    }
    setApp(mockApp)
    setIsLoading(false)
  }, [appId])

  const formatPrice = (amount: number) => {
    return amount.toLocaleString()
  }

  const calculateFee = (price: number) => {
    // 手数料10%
    return Math.floor(price * 0.1)
  }

  const handlePayment = async () => {
    if (!termsAccepted || !transferAccepted || !privacyAccepted) {
      alert('すべての契約書項目に同意してください')
      return
    }

    setIsProcessing(true)

    try {
      // TODO: Stripe決済セッション作成APIを呼び出し
      console.log('決済処理開始:', {
        appId: app?.id,
        amount: app?.price,
      })

      // 仮の処理
      await new Promise((resolve) => setTimeout(resolve, 2000))

      alert('決済が完了しました')
      router.push(`/transactions/${appId}`)
    } catch (error) {
      console.error('決済エラー:', error)
      alert('決済に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F9F8F7' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">プロダクトが見つかりません</h2>
        </div>
      </div>
    )
  }

  const fee = calculateFee(app.price)
  const total = app.price + fee

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          購入手続き
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：商品情報 */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-gray-900 p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">購入するプロダクト</h2>

              <div className="flex items-start space-x-6 mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 border-2 flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">📱</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {app.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{app.description}</p>
                  <p className="text-sm text-gray-500">
                    売り手: {app.seller_name}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700">プロダクト価格</span>
                  <span className="text-xl font-bold text-gray-900">
                    ¥{formatPrice(app.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-700">手数料（10%）</span>
                  <span className="text-lg text-gray-700">
                    ¥{formatPrice(fee)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">合計</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ¥{formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 契約書項目 */}
            <div className="bg-white border-2 border-gray-900 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                契約書への同意
              </h2>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border-gray-900 border-2 hover:bg-blue-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      利用規約
                    </div>
                    <p className="text-sm text-gray-600">
                      AppExitの利用規約に同意します
                    </p>
                    <a href="/terms" target="_blank" className="text-sm text-blue-600 hover:underline">
                      規約を確認する →
                    </a>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border-gray-900 border-2 hover:bg-blue-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferAccepted}
                    onChange={(e) => setTransferAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      譲渡契約書
                    </div>
                    <p className="text-sm text-gray-600">
                      プロダクトの所有権譲渡に関する契約書に同意します
                    </p>
                    <a href="/transfer-agreement" target="_blank" className="text-sm text-blue-600 hover:underline">
                      契約書を確認する →
                    </a>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border-gray-900 border-2 hover:bg-blue-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      個人情報取扱い
                    </div>
                    <p className="text-sm text-gray-600">
                      個人情報の取扱いに関する方針に同意します
                    </p>
                    <a href="/privacy" target="_blank" className="text-sm text-blue-600 hover:underline">
                      方針を確認する →
                    </a>
                  </div>
                </label>
              </div>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 border-2 p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm text-yellow-800">
                    <strong>重要:</strong> すべての契約書項目に同意しないと購入できません。内容を十分に確認してからチェックを入れてください。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：購入ボタン */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-900 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                お支払い
              </h3>

              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-1">合計金額</div>
                <div className="text-3xl font-bold text-blue-600">
                  ¥{formatPrice(total)}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mb-4"
                onClick={handlePayment}
                disabled={!termsAccepted || !transferAccepted || !privacyAccepted}
                isLoading={isProcessing}
                loadingText="処理中..."
              >
                Stripeで支払う
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <span>🔒</span>
                  <span>安全な決済</span>
                </div>
                <p className="text-xs text-gray-500">
                  すべての決済はStripeによって安全に処理されます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
