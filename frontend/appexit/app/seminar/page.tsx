import Link from 'next/link'

export default function SeminarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">説明会・相談会</h1>
          <p className="text-xl text-gray-600">
            アプリ・Webサービスの売買について、専門スタッフが丁寧にご説明します
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* オンライン説明会 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">オンライン説明会</h2>
                <p className="text-sm text-gray-500">無料・予約制</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">こんな方におすすめ</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>APPEXITの仕組みを詳しく知りたい</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>アプリ・サービスの売却を検討している</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>手数料や取引の流れを確認したい</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span>まずは気軽に話を聞いてみたい</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">開催情報</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">開催日時：</span>平日 10:00〜19:00（1回30分〜60分）</p>
                  <p><span className="font-medium">形式：</span>Zoom、Google Meet など</p>
                  <p><span className="font-medium">参加費：</span>無料</p>
                  <p><span className="font-medium">定員：</span>個別対応（1組ごと）</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">説明内容</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• APPEXITの特徴とメリット</li>
                  <li>• 売却・購入の流れと期間</li>
                  <li>• 手数料体系の詳細</li>
                  <li>• 審査基準と必要書類</li>
                  <li>• 成約事例のご紹介</li>
                  <li>• 質疑応答</li>
                </ul>
              </div>

              <Link
                href="/contact?type=seminar"
                className="block w-full py-3 px-6 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                オンライン説明会を予約する
              </Link>
            </div>
          </div>

          {/* 個別相談会 */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">個別相談会</h2>
                <p className="text-sm text-gray-500">無料・秘密厳守</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">こんな方におすすめ</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>具体的な案件について相談したい</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>売却価格の目安を知りたい</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>出品前のアドバイスが欲しい</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>購入を検討している案件がある</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">相談方法</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">相談時間：</span>平日 10:00〜19:00（1回30分〜90分）</p>
                  <p><span className="font-medium">形式：</span>オンライン or 対面（東京オフィス）</p>
                  <p><span className="font-medium">相談費：</span>無料</p>
                  <p><span className="font-medium">秘密保持：</span>NDA締結可能</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">相談内容例</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• 売却価格の査定・相場感</li>
                  <li>• 売却タイミングのアドバイス</li>
                  <li>• 出品資料の作成サポート</li>
                  <li>• デューデリジェンス対策</li>
                  <li>• 契約書のレビュー</li>
                  <li>• その他、取引に関するご質問</li>
                </ul>
              </div>

              <Link
                href="/contact?type=consultation"
                className="block w-full py-3 px-6 bg-green-600 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                個別相談会を予約する
              </Link>
            </div>
          </div>
        </div>

        {/* よくある質問 */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">よくある質問</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. 説明会・相談会は本当に無料ですか？</h3>
              <p className="text-gray-700 ml-4">
                はい、完全無料です。説明会・相談会への参加費用は一切かかりません。
                実際に出品・購入される場合のみ、取引成立時に手数料が発生します。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. 参加には何が必要ですか？</h3>
              <p className="text-gray-700 ml-4">
                オンラインの場合、インターネット環境とZoomやGoogle Meetなどのビデオ通話ツールが使える端末が必要です。
                事前に簡単なヒアリングシートにご記入いただく場合があります。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. 具体的な案件がなくても参加できますか？</h3>
              <p className="text-gray-700 ml-4">
                もちろんです。「将来的に売却を検討している」「まずは情報収集したい」という段階でもお気軽にご参加ください。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. 相談内容は秘密にしていただけますか？</h3>
              <p className="text-gray-700 ml-4">
                はい、ご相談内容は厳重に管理し、第三者に開示することはありません。
                必要に応じてNDA（秘密保持契約）の締結も可能です。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. キャンセルはできますか？</h3>
              <p className="text-gray-700 ml-4">
                ご予約のキャンセルは可能です。前日までにご連絡いただければ幸いです。
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Q. 土日祝日の対応は可能ですか？</h3>
              <p className="text-gray-700 ml-4">
                基本的には平日のみの対応となりますが、ご事情により土日祝日をご希望の場合は個別にご相談ください。
                可能な限り調整させていただきます。
              </p>
            </div>
          </div>
        </div>

        {/* お申し込みの流れ */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">お申し込みの流れ</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">お申し込み</h3>
              <p className="text-sm text-gray-600">
                フォームから希望日時を選択してお申し込みください
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">日程調整</h3>
              <p className="text-sm text-gray-600">
                担当者から日程確認のご連絡をいたします
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">事前準備</h3>
              <p className="text-sm text-gray-600">
                オンライン接続情報や資料をお送りします
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">当日参加</h3>
              <p className="text-sm text-gray-600">
                専門スタッフが丁寧にご説明・ご相談に対応します
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">まずはお気軽にご相談ください</h2>
          <p className="text-lg mb-6 text-blue-100">
            アプリ・Webサービスの売買に関するご質問、ご相談を専門スタッフがサポートいたします
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=seminar"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              説明会を予約する
            </Link>
            <Link
              href="/contact?type=consultation"
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
            >
              個別相談を予約する
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

