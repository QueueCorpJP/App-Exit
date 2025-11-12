import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">ヘルプ</h1>
          <p className="text-gray-600">
            困ったときはこちらをご確認ください。よくある質問やお問い合わせ、各種ポリシーのページをご案内します。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ガイド</h2>
            <ul className="space-y-3 text-blue-700">
              <li>
                <Link href="/faq" className="hover:underline">
                  よくある質問（FAQ）
                </Link>
              </li>
              <li>
                <Link href="/support-service" className="hover:underline">
                  サポートサービス
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  APPEXITについて
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">お困りのとき</h2>
            <ul className="space-y-3 text-blue-700">
              <li>
                <Link href="/contact" className="hover:underline">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:underline">
                  違反報告
                </Link>
              </li>
              <li>
                <Link href="/seminar" className="hover:underline">
                  説明会・相談会
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ポリシー・法令</h2>
            <ul className="space-y-3 text-blue-700">
              <li>
                <Link href="/terms" className="hover:underline">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:underline">
                  クッキーポリシー
                </Link>
              </li>
              <li>
                <Link href="/tokusho" className="hover:underline">
                  特定商取引法に基づく表記
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:underline">
                  情報セキュリティ基本方針
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="hover:underline">
                  反社会的勢力に対する基本方針
                </Link>
              </li>
              <li>
                <Link href="/customer-harassment" className="hover:underline">
                  カスタマーハラスメントに対する考え方
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


