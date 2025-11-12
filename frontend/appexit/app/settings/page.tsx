import Link from 'next/link'

export default function SettingsIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">各種設定</h1>
          <p className="text-gray-600 mb-8">
            アカウント情報や支払い関連の設定を管理できます。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/settings/profile"
              className="block border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">プロフィール設定</h2>
              <p className="text-sm text-gray-600">
                表示名、自己紹介、連絡先などのプロフィール情報を編集します。
              </p>
            </Link>

            <Link
              href="/settings/payment"
              className="block border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">決済・受取設定</h2>
              <p className="text-sm text-gray-600">
                売上受け取り口座や決済関連の設定を管理します。
              </p>
            </Link>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">ヘルプ</h3>
            <p className="text-sm text-gray-700">
              設定の操作方法について不明点がある場合は、{' '}
              <Link href="/help" className="text-blue-600 hover:text-blue-800 underline">
                ヘルプ
              </Link>
              {' '}や{' '}
              <Link href="/faq" className="text-blue-600 hover:text-blue-800 underline">
                よくある質問
              </Link>
              {' '}をご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


