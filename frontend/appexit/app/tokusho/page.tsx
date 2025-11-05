export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              特定商取引法に基づき、以下のとおり表示いたします。
            </p>

            <div className="space-y-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">販売業者</h2>
                <p className="text-gray-700">Queue株式会社</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">運営統括責任者</h2>
                <p className="text-gray-700">代表取締役 谷口太一</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">所在地</h2>
                <p className="text-gray-700">〒104-0061</p>
                <p className="text-gray-700">東京都中央区銀座８丁目17-5</p>
                <p className="text-gray-700">THE HUB 銀座 OCT</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">連絡先</h2>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">電話番号：</span>03-5324-2678
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">メールアドレス：</span>support@appexit.co.jp
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">営業時間：</span>平日 10:00～18:00（土日祝日除く）
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">販売価格</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">各商品・サービスの価格は、各商品・サービスの詳細ページに記載しております。</p>
                  <p className="text-gray-700">価格は消費税込みの金額を表示しております。</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">支払い方法</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>クレジットカード決済（VISA、MasterCard、JCB、American Express、Diners Club）</li>
                  <li>コンビニ決済</li>
                  <li>銀行振込</li>
                  <li>PayPal</li>
                  <li>その他、当社が指定する決済方法</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">支払い時期</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-medium">クレジットカード決済：</span>購入手続き完了時
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">コンビニ決済：</span>購入手続き完了後、指定期日まで
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">銀行振込：</span>購入手続き完了後、指定期日まで
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">PayPal：</span>購入手続き完了時
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">商品・サービスの提供時期</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-medium">アプリ・Webサービスの譲渡：</span>売買契約締結後、売り手・買い手間で合意した期日
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">デジタルコンテンツ：</span>決済完了後、即時または各商品・サービス詳細ページに記載された期日
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">その他サービス：</span>各サービス詳細ページに記載された期日
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">返品・交換・キャンセル</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">アプリ・Webサービスの売買</h3>
                    <p className="text-gray-700">
                      アプリ・Webサービスの譲渡契約の性質上、原則として返品・返金・契約解除は受け付けておりません。
                      ただし、売り手が虚偽の情報を提供した場合や、当社の責めに帰すべき事由がある場合はこの限りではありません。
                      取引開始前に十分な確認を行うことを推奨いたします。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">デジタルコンテンツ</h3>
                    <p className="text-gray-700">
                      デジタルコンテンツの性質上、原則として返品・返金は受け付けておりません。
                      ただし、当社の責めに帰すべき事由がある場合はこの限りではありません。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">その他サービス</h3>
                    <p className="text-gray-700">
                      各サービスの内容により異なります。詳細は各サービスページをご確認ください。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">返品送料</h2>
                <p className="text-gray-700">
                  当社の責めに帰すべき事由による返品の場合：当社負担
                  <br />
                  お客様のご都合による返品の場合：お客様負担
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">サービス手数料</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-medium">決済手数料：</span>決済金額の3.6%（税別）
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">取引成立手数料（売り手）：</span>売買成立時の取引金額の10%（税別）
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">取引成立手数料（買い手）：</span>売買成立時の取引金額の5%（税別）
                  </p>
                  <p className="text-gray-700">
                    詳細は各サービス利用時にご確認ください。
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">個人情報の取り扱い</h2>
                <p className="text-gray-700">
                  お客様の個人情報については、当社の
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</a>
                  に従って適切に取り扱います。
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">その他</h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    当サービスの利用に関する詳細については、
                    <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">利用規約</a>
                    をご確認ください。
                  </p>
                  <p className="text-gray-700">
                    ご不明な点がございましたら、上記連絡先までお問い合わせください。
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">苦情・相談窓口</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">当社窓口</h3>
                    <p className="text-gray-700">
                      Queue株式会社 カスタマーサポート
                      <br />
                      メールアドレス：support@appexit.co.jp
                      <br />
                      電話番号：03-6455-7890
                      <br />
                      受付時間：平日 10:00～18:00（土日祝日除く）
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">外部窓口</h3>
                    <p className="text-gray-700">
                      消費者ホットライン：188（いやや）
                      <br />
                      国民生活センター：
                      <a href="http://www.kokusen.go.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                        http://www.kokusen.go.jp/
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">制定日：2025年11月1日</p>
              <p className="text-sm text-gray-500">最終改訂日：2025年11月1日</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}