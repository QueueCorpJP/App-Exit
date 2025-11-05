export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">クッキーポリシー</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Queue株式会社（以下「当社」といいます。）は、当社の提供するアプリ・Webサービス売買プラットフォーム「APPEXIT」（以下「本サービス」といいます。）において、
              ユーザーの利便性向上とサービス品質の改善のために、Cookie（クッキー）およびこれに類する技術を使用しております。
              本ポリシーでは、Cookieの使用目的、種類、管理方法等について説明いたします。
            </p>

            <div className="space-y-8">
              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第1条（Cookieとは）</h2>
                <p className="text-gray-700 mb-3">
                  Cookieとは、ウェブサイトがユーザーのコンピューターやスマートフォン等のブラウザに一時的にデータを保存させる仕組みです。
                  Cookieには以下のような特徴があります。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>ユーザーのブラウザに小さなテキストファイルとして保存されます</li>
                  <li>ウェブサイトがユーザーの設定や行動履歴を記憶することができます</li>
                  <li>ユーザーの同意なく個人を特定する情報を取得することはありません</li>
                  <li>ユーザーはブラウザの設定でCookieを無効化することができます</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第2条（Cookieの使用目的）</h2>
                <p className="text-gray-700 mb-3">
                  当社は、以下の目的でCookieを使用しております。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">1. サービスの提供・運営</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>ユーザーのログイン状態を維持するため</li>
                      <li>売り手・買い手の設定や選択を記憶するため</li>
                      <li>セキュリティの確保およびサービスの不正利用を防止するため</li>
                      <li>閲覧履歴やお気に入り登録情報を保持するため</li>
                      <li>取引の進行状況を管理するため</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">2. サービスの改善・分析</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>アプリ・サービスの閲覧傾向や取引動向を分析するため</li>
                      <li>マッチング精度を向上させるため</li>
                      <li>検索機能や推薦機能の改善のため</li>
                      <li>新機能の開発や既存機能の改善のため</li>
                      <li>エラーの発見と修正のため</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">3. パーソナライズとマーケティング</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>ユーザーの興味・関心に合わせたアプリやサービスを推薦するため</li>
                      <li>売り手へのマーケティング情報を最適化するため</li>
                      <li>広告の効果測定を行うため</li>
                      <li>メールマガジンやお知らせの配信を最適化するため</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第3条（Cookieの種類）</h2>
                <p className="text-gray-700 mb-4">
                  当社が使用するCookieには、以下の種類があります。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">1. ファーストパーティCookie</h3>
                    <p className="text-gray-700">
                      当社が直接発行・管理するCookieです。サービスの基本機能の提供や、
                      ユーザー体験の向上のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">2. サードパーティCookie</h3>
                    <p className="text-gray-700">
                      当社以外の第三者（広告配信事業者、アクセス解析事業者等）が発行・管理するCookieです。
                      広告配信の最適化やアクセス解析のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">3. セッションCookie</h3>
                    <p className="text-gray-700">
                      ブラウザを閉じると自動的に削除される一時的なCookieです。
                      主にセッション管理のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">4. 永続Cookie</h3>
                    <p className="text-gray-700">
                      一定期間保存されるCookieです。ユーザーの設定や選択を記憶し、
                      次回訪問時も同じ設定を維持するために使用されます。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第4条（使用するCookieの詳細）</h2>
                <p className="text-gray-700 mb-4">
                  当社のサービスでは、以下のCookieを使用しています。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">必須Cookie</h3>
                    <p className="text-gray-700 mb-2">
                      サービスの基本機能を提供するために必要不可欠なCookieです。これらを無効にすると、
                      サービスの一部機能が正常に動作しない場合があります。
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>セッション管理Cookie：ログイン状態の維持、取引セッション管理</li>
                      <li>セキュリティCookie：CSRF対策、不正アクセス防止、本人確認</li>
                      <li>負荷分散Cookie：サーバーの負荷分散</li>
                      <li>取引管理Cookie：売買プロセスの状態管理</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">分析Cookie</h3>
                    <p className="text-gray-700 mb-2">
                      サービスの利用状況を分析し、改善するために使用するCookieです。
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Google Analytics：アクセス解析、閲覧動向分析</li>
                      <li>独自分析ツール：取引行動分析、マッチング効果測定</li>
                      <li>ヒートマップツール：ユーザビリティ改善</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">マーケティングCookie</h3>
                    <p className="text-gray-700 mb-2">
                      ユーザーの興味・関心に合わせた情報提供や広告配信のために使用するCookieです。
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Google AdSense：外部広告配信</li>
                      <li>Facebook Pixel：広告効果測定、リターゲティング</li>
                      <li>Twitter広告：広告配信と効果測定</li>
                      <li>独自レコメンドエンジン：アプリ・サービスの推薦</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第5条（Cookieの管理方法）</h2>
                <p className="text-gray-700 mb-4">
                  ユーザーは、ブラウザの設定によりCookieを管理することができます。
                  ただし、Cookieを無効にした場合、本サービスの一部機能が利用できなくなる可能性があります。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">主要ブラウザでのCookie設定方法</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        <span className="font-medium">Google Chrome：</span>
                        設定 &gt; プライバシーとセキュリティ &gt; Cookie と他のサイトデータ
                      </li>
                      <li>
                        <span className="font-medium">Microsoft Edge：</span>
                        設定 &gt; Cookie とサイトのアクセス許可 &gt; Cookie とサイト データの管理と削除
                      </li>
                      <li>
                        <span className="font-medium">Safari：</span>
                        環境設定 &gt; プライバシー &gt; Cookie とWebサイトのデータ
                      </li>
                      <li>
                        <span className="font-medium">Firefox：</span>
                        オプション &gt; プライバシーとセキュリティ &gt; Cookie とサイトデータ
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">オプトアウト（広告Cookieの無効化）</h3>
                    <p className="text-gray-700 mb-2">
                      以下のリンクから、広告配信事業者のCookieを無効化することができます。
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          Google広告設定
                        </a>
                      </li>
                      <li>
                        <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          Facebook広告設定
                        </a>
                      </li>
                      <li>
                        <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          DAA オプトアウト
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第6条（その他の追跡技術）</h2>
                <p className="text-gray-700 mb-3">
                  当社は、Cookie以外にも以下の技術を使用する場合があります。
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">ウェブビーコン</h3>
                    <p className="text-gray-700">
                      ウェブページやメールに埋め込まれた小さな画像ファイルで、
                      ページの閲覧状況やメールの開封状況を確認するために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">ローカルストレージ</h3>
                    <p className="text-gray-700">
                      ブラウザに情報を保存する技術で、Cookieよりも多くのデータを保存できます。
                      検索条件の保存、下書き保存、閲覧履歴の管理などに使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">デバイスフィンガープリント</h3>
                    <p className="text-gray-700">
                      ブラウザやデバイスの設定情報を組み合わせて識別する技術です。
                      不正利用の検知やセキュリティの向上のために使用されます。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第7条（同意の取得と変更）</h2>
                <p className="text-gray-700 mb-3">
                  当社は、本サービスの初回利用時に、Cookie使用への同意をお願いしております。
                  ユーザーは、以下の方法で同意の内容を変更することができます。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>ブラウザの設定からCookieを削除または無効化する</li>
                  <li>本サービスの設定画面からCookie設定を変更する</li>
                  <li>上記オプトアウトリンクから広告Cookieを無効化する</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第8条（プライバシーポリシーとの関係）</h2>
                <p className="text-gray-700">
                  本ポリシーは、当社の
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                    プライバシーポリシー
                  </a>
                  と併せてお読みください。Cookie等により取得した情報の取扱いについては、
                  プライバシーポリシーに従って適切に管理いたします。
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第9条（ポリシーの変更）</h2>
                <p className="text-gray-700">
                  当社は、法令の変更やサービスの改善等に伴い、本ポリシーを変更することがあります。
                  変更後のポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
                  重要な変更がある場合は、サービス内で通知いたします。
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">第10条（お問い合わせ）</h2>
                <p className="text-gray-700 mb-4">
                  本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-700 font-semibold">Queue株式会社</p>
                  <p className="text-gray-700">Cookie管理担当</p>
                  <p className="text-gray-700">メールアドレス：privacy@appexit.jp</p>
                  <p className="text-gray-700">住所：〒104-0061 東京都中央区銀座８丁目17-5 THE HUB 銀座 OCT</p>
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

