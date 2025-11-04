'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface NDAPageProps {
  appId: string
  sellerId: string
}

export default function NDAPage({ appId, sellerId }: NDAPageProps) {
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const router = useRouter()

  const handleSign = async () => {
    if (!agreed || !signature) {
      alert('すべての項目に同意し、署名を入力してください')
      return
    }

    setIsSigning(true)

    try {
      // TODO: APIにNDA署名を送信
      console.log('NDA署名:', {
        appId,
        sellerId,
        signature,
        signedAt: new Date().toISOString(),
      })

      alert('NDAの締結が完了しました')
      router.push(`/projects/${appId}`)
    } catch (error) {
      console.error('署名エラー:', error)
      alert('署名に失敗しました')
    } finally {
      setIsSigning(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border-2 border-gray-900 p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📜</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              秘密保持契約書（NDA）
            </h1>
            <p className="text-gray-600">
              Non-Disclosure Agreement
            </p>
          </div>

          {/* 注意事項 */}
          <div className="bg-yellow-50 border border-yellow-200 border-2 p-6 mb-8">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  重要なお知らせ
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• この契約書は法的拘束力を持ちます</li>
                  <li>• 守秘義務違反には損害賠償請求が行われる可能性があります</li>
                  <li>• 内容を十分に理解した上で署名してください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 契約書本文 */}
          <div className="bg-blue-50/50 border-2 p-6 mb-8 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">第1条（目的）</h2>
            <p className="text-sm text-gray-700 mb-6">
              本契約は、開示者が受領者に対して開示する秘密情報の取り扱いについて定めることを目的とします。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第2条（秘密情報の定義）</h2>
            <p className="text-sm text-gray-700 mb-6">
              本契約において「秘密情報」とは、開示者が受領者に対して開示する、技術上、営業上、その他業務上の一切の情報（プロダクトケーションのソースコード、設計書、顧客情報、売上情報、技術情報等を含むがこれらに限られない）をいいます。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第3条（秘密保持義務）</h2>
            <p className="text-sm text-gray-700 mb-6">
              受領者は、秘密情報を厳に秘密として保持し、開示者の事前の書面による承諾なく、第三者に開示、漏洩してはならないものとします。また、受領者は、秘密情報を本契約の目的以外に使用してはならないものとします。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第4条（秘密情報の例外）</h2>
            <p className="text-sm text-gray-700 mb-6">
              以下の情報は秘密情報に該当しないものとします：
            </p>
            <ul className="text-sm text-gray-700 mb-6 list-disc list-inside space-y-1">
              <li>開示時に既に公知であった情報</li>
              <li>開示後、受領者の責めに帰すべき事由によらず公知となった情報</li>
              <li>開示時に既に受領者が保有していた情報</li>
              <li>正当な権限を有する第三者から秘密保持義務を負うことなく入手した情報</li>
            </ul>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第5条（秘密情報の管理）</h2>
            <p className="text-sm text-gray-700 mb-6">
              受領者は、秘密情報を自己の秘密情報と同等の注意義務をもって管理するものとします。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第6条（有効期間）</h2>
            <p className="text-sm text-gray-700 mb-6">
              本契約の有効期間は、契約締結日から5年間とします。ただし、秘密保持義務は、秘密情報の開示後5年間継続するものとします。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第7条（損害賠償）</h2>
            <p className="text-sm text-gray-700 mb-6">
              受領者が本契約に違反したことにより開示者に損害が生じた場合、受領者は、開示者に対し、当該損害を賠償する責任を負うものとします。
            </p>

            <h2 className="text-lg font-bold text-gray-900 mb-4">第8条（準拠法・管轄裁判所）</h2>
            <p className="text-sm text-gray-700">
              本契約は日本法に準拠するものとし、本契約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </div>

          {/* 同意チェックボックス */}
          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  上記の秘密保持契約書の内容を理解し、同意します
                </span>
              </div>
            </label>
          </div>

          {/* 電子署名 */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              電子署名（あなたの氏名を入力してください）
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="山田太郎"
              className="w-full px-4 py-3 border border-gray-300 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-serif text-xl"
            />
            <p className="text-xs text-gray-500 mt-2">
              署名日時: {new Date().toLocaleString('ja-JP')}
            </p>
          </div>

          {/* ボタン */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSign}
              disabled={!agreed || !signature}
              isLoading={isSigning}
              loadingText="署名中..."
            >
              署名して契約する
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
