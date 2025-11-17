import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function CookiePolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const legalDict = await loadPageDictionary(locale, 'legal');
  const tp = (key: string): string => {
    const keys = key.split('.');
    let value: any = legalDict;
    for (const k of keys) { value = value?.[k]; }
    return value || key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{tp('cookiePolicy.title')}</h1>

          {locale === 'ja' ? (
            <div className="prose max-w-none">
            <p className="mb-8">
              Queue株式会社（以下「当社」といいます。）は、当社の提供するアプリ・Webサービス売買プラットフォーム「APPEXIT」（以下「本サービス」といいます。）において、
              ユーザーの利便性向上とサービス品質の改善のために、Cookie（クッキー）およびこれに類する技術を使用しております。
              本ポリシーでは、Cookieの使用目的、種類、管理方法等について説明いたします。
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">第1条（Cookieとは）</h2>
                <p className="mb-3">
                  Cookieとは、ウェブサイトがユーザーのコンピューターやスマートフォン等のブラウザに一時的にデータを保存させる仕組みです。
                  Cookieには以下のような特徴があります。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>ユーザーのブラウザに小さなテキストファイルとして保存されます</li>
                  <li>ウェブサイトがユーザーの設定や行動履歴を記憶することができます</li>
                  <li>ユーザーの同意なく個人を特定する情報を取得することはありません</li>
                  <li>ユーザーはブラウザの設定でCookieを無効化することができます</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第2条（Cookieの使用目的）</h2>
                <p className="mb-3">
                  当社は、以下の目的でCookieを使用しております。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. サービスの提供・運営</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>ユーザーのログイン状態を維持するため</li>
                      <li>売り手・買い手の設定や選択を記憶するため</li>
                      <li>セキュリティの確保およびサービスの不正利用を防止するため</li>
                      <li>閲覧履歴やお気に入り登録情報を保持するため</li>
                      <li>取引の進行状況を管理するため</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">2. サービスの改善・分析</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>アプリ・サービスの閲覧傾向や取引動向を分析するため</li>
                      <li>マッチング精度を向上させるため</li>
                      <li>検索機能や推薦機能の改善のため</li>
                      <li>新機能の開発や既存機能の改善のため</li>
                      <li>エラーの発見と修正のため</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">3. パーソナライズとマーケティング</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>ユーザーの興味・関心に合わせたアプリやサービスを推薦するため</li>
                      <li>売り手へのマーケティング情報を最適化するため</li>
                      <li>広告の効果測定を行うため</li>
                      <li>メールマガジンやお知らせの配信を最適化するため</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第3条（Cookieの種類）</h2>
                <p className="mb-4">
                  当社が使用するCookieには、以下の種類があります。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. ファーストパーティCookie</h3>
                    <p>
                      当社が直接発行・管理するCookieです。サービスの基本機能の提供や、
                      ユーザー体験の向上のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">2. サードパーティCookie</h3>
                    <p>
                      当社以外の第三者（広告配信事業者、アクセス解析事業者等）が発行・管理するCookieです。
                      広告配信の最適化やアクセス解析のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">3. セッションCookie</h3>
                    <p>
                      ブラウザを閉じると自動的に削除される一時的なCookieです。
                      主にセッション管理のために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">4. 永続Cookie</h3>
                    <p>
                      一定期間保存されるCookieです。ユーザーの設定や選択を記憶し、
                      次回訪問時も同じ設定を維持するために使用されます。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第4条（使用するCookieの詳細）</h2>
                <p className="mb-4">
                  当社のサービスでは、以下のCookieを使用しています。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">必須Cookie</h3>
                    <p className="mb-2">
                      サービスの基本機能を提供するために必要不可欠なCookieです。これらを無効にすると、
                      サービスの一部機能が正常に動作しない場合があります。
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>セッション管理Cookie：ログイン状態の維持、取引セッション管理</li>
                      <li>セキュリティCookie：CSRF対策、不正アクセス防止、本人確認</li>
                      <li>負荷分散Cookie：サーバーの負荷分散</li>
                      <li>取引管理Cookie：売買プロセスの状態管理</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">分析Cookie</h3>
                    <p className="mb-2">
                      サービスの利用状況を分析し、改善するために使用するCookieです。
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Google Analytics：アクセス解析、閲覧動向分析</li>
                      <li>独自分析ツール：取引行動分析、マッチング効果測定</li>
                      <li>ヒートマップツール：ユーザビリティ改善</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">マーケティングCookie</h3>
                    <p className="mb-2">
                      ユーザーの興味・関心に合わせた情報提供や広告配信のために使用するCookieです。
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Google AdSense：外部広告配信</li>
                      <li>Facebook Pixel：広告効果測定、リターゲティング</li>
                      <li>Twitter広告：広告配信と効果測定</li>
                      <li>独自レコメンドエンジン：アプリ・サービスの推薦</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第5条（Cookieの管理方法）</h2>
                <p className="mb-4">
                  ユーザーは、ブラウザの設定によりCookieを管理することができます。
                  ただし、Cookieを無効にした場合、本サービスの一部機能が利用できなくなる可能性があります。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">主要ブラウザでのCookie設定方法</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
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
                    <h3 className="font-semibold mb-2">オプトアウト（広告Cookieの無効化）</h3>
                    <p className="mb-2">
                      以下のリンクから、広告配信事業者のCookieを無効化することができます。
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
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

              <div>
                <h2 className="text-xl font-semibold mb-4">第6条（その他の追跡技術）</h2>
                <p className="mb-3">
                  当社は、Cookie以外にも以下の技術を使用する場合があります。
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">ウェブビーコン</h3>
                    <p>
                      ウェブページやメールに埋め込まれた小さな画像ファイルで、
                      ページの閲覧状況やメールの開封状況を確認するために使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">ローカルストレージ</h3>
                    <p>
                      ブラウザに情報を保存する技術で、Cookieよりも多くのデータを保存できます。
                      検索条件の保存、下書き保存、閲覧履歴の管理などに使用されます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">デバイスフィンガープリント</h3>
                    <p>
                      ブラウザやデバイスの設定情報を組み合わせて識別する技術です。
                      不正利用の検知やセキュリティの向上のために使用されます。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第7条（同意の取得と変更）</h2>
                <p className="mb-3">
                  当社は、本サービスの初回利用時に、Cookie使用への同意をお願いしております。
                  ユーザーは、以下の方法で同意の内容を変更することができます。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>ブラウザの設定からCookieを削除または無効化する</li>
                  <li>本サービスの設定画面からCookie設定を変更する</li>
                  <li>上記オプトアウトリンクから広告Cookieを無効化する</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第8条（プライバシーポリシーとの関係）</h2>
                <p>
                  本ポリシーは、当社の
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                    プライバシーポリシー
                  </a>
                  と併せてお読みください。Cookie等により取得した情報の取扱いについては、
                  プライバシーポリシーに従って適切に管理いたします。
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第9条（ポリシーの変更）</h2>
                <p>
                  当社は、法令の変更やサービスの改善等に伴い、本ポリシーを変更することがあります。
                  変更後のポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
                  重要な変更がある場合は、サービス内で通知いたします。
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">第10条（お問い合わせ）</h2>
                <p className="mb-4">
                  本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold">Queue株式会社</p>
                  <p>Cookie管理担当</p>
                  <p>メールアドレス：privacy@appexit.jp</p>
                  <p>住所：〒104-0061 東京都中央区銀座８丁目17-5 THE HUB 銀座 OCT</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">制定日：2025年11月1日</p>
              <p className="text-sm text-gray-500">最終改訂日：2025年11月1日</p>
            </div>
          </div>
          ) : (
            <div className="prose max-w-none">
            <p className="mb-8">
              Queue Inc. (hereinafter referred to as "the Company") uses Cookies and similar technologies in the app and web service trading platform "APPEXIT" (hereinafter referred to as "the Service") provided by the Company,
              for the purpose of improving user convenience and service quality.
              This policy explains the purpose of use, types, and management methods of Cookies.
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Article 1 (What are Cookies)</h2>
                <p className="mb-3">
                  Cookies are a mechanism by which websites temporarily store data in the browser of a user's computer or smartphone.
                  Cookies have the following characteristics:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Stored as small text files in the user's browser</li>
                  <li>Allows websites to remember user settings and behavior history</li>
                  <li>Does not acquire personally identifiable information without user consent</li>
                  <li>Users can disable Cookies through browser settings</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 2 (Purpose of Using Cookies)</h2>
                <p className="mb-3">
                  The Company uses Cookies for the following purposes:
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. Service Provision and Operation</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>To maintain user login status</li>
                      <li>To remember seller/buyer settings and selections</li>
                      <li>To ensure security and prevent unauthorized use of the service</li>
                      <li>To retain browsing history and favorite registration information</li>
                      <li>To manage transaction progress</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">2. Service Improvement and Analysis</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>To analyze browsing trends and transaction trends of apps and services</li>
                      <li>To improve matching accuracy</li>
                      <li>To improve search and recommendation functions</li>
                      <li>To develop new features and improve existing features</li>
                      <li>To discover and fix errors</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">3. Personalization and Marketing</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>To recommend apps and services tailored to user interests</li>
                      <li>To optimize marketing information for sellers</li>
                      <li>To measure advertising effectiveness</li>
                      <li>To optimize email newsletters and notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 3 (Types of Cookies)</h2>
                <p className="mb-4">
                  The Cookies used by the Company include the following types:
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">1. First-Party Cookies</h3>
                    <p>
                      Cookies issued and managed directly by the Company. Used to provide basic service functions and
                      improve user experience.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">2. Third-Party Cookies</h3>
                    <p>
                      Cookies issued and managed by third parties other than the Company (advertising distributors, access analysis providers, etc.).
                      Used for optimizing advertising delivery and access analysis.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">3. Session Cookies</h3>
                    <p>
                      Temporary Cookies that are automatically deleted when the browser is closed.
                      Mainly used for session management.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">4. Persistent Cookies</h3>
                    <p>
                      Cookies that are stored for a certain period of time. Used to remember user settings and selections
                      and maintain the same settings on the next visit.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 4 (Details of Cookies Used)</h2>
                <p className="mb-4">
                  The following Cookies are used in our service:
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Essential Cookies</h3>
                    <p className="mb-2">
                      Cookies that are essential for providing basic service functions. Disabling these may prevent
                      some service functions from operating properly.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Session Management Cookies: Maintaining login status, managing transaction sessions</li>
                      <li>Security Cookies: CSRF countermeasures, unauthorized access prevention, identity verification</li>
                      <li>Load Balancing Cookies: Server load balancing</li>
                      <li>Transaction Management Cookies: Managing the status of buying and selling processes</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Analytics Cookies</h3>
                    <p className="mb-2">
                      Cookies used to analyze service usage and make improvements.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Google Analytics: Access analysis, browsing trend analysis</li>
                      <li>Proprietary Analytics Tools: Transaction behavior analysis, matching effect measurement</li>
                      <li>Heatmap Tools: Usability improvement</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Marketing Cookies</h3>
                    <p className="mb-2">
                      Cookies used to provide information and deliver advertisements tailored to user interests.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Google AdSense: External advertising delivery</li>
                      <li>Facebook Pixel: Advertising effectiveness measurement, retargeting</li>
                      <li>Twitter Advertising: Advertising delivery and effectiveness measurement</li>
                      <li>Proprietary Recommendation Engine: App and service recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 5 (Cookie Management Methods)</h2>
                <p className="mb-4">
                  Users can manage Cookies through browser settings.
                  However, disabling Cookies may prevent some service functions from being used.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Cookie Settings in Major Browsers</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <span className="font-medium">Google Chrome:</span>
                        Settings &gt; Privacy and Security &gt; Cookies and other site data
                      </li>
                      <li>
                        <span className="font-medium">Microsoft Edge:</span>
                        Settings &gt; Cookies and site permissions &gt; Manage and delete cookies and site data
                      </li>
                      <li>
                        <span className="font-medium">Safari:</span>
                        Preferences &gt; Privacy &gt; Cookies and website data
                      </li>
                      <li>
                        <span className="font-medium">Firefox:</span>
                        Options &gt; Privacy and Security &gt; Cookies and site data
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Opt-Out (Disabling Advertising Cookies)</h3>
                    <p className="mb-2">
                      You can disable advertising distributor Cookies from the following links:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          Google Ad Settings
                        </a>
                      </li>
                      <li>
                        <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          Facebook Ad Settings
                        </a>
                      </li>
                      <li>
                        <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          DAA Opt-Out
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 6 (Other Tracking Technologies)</h2>
                <p className="mb-3">
                  The Company may use the following technologies in addition to Cookies:
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">Web Beacons</h3>
                    <p>
                      Small image files embedded in web pages or emails, used to confirm
                      page viewing status or email opening status.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Local Storage</h3>
                    <p>
                      A technology for storing information in the browser, capable of storing more data than Cookies.
                      Used for saving search conditions, saving drafts, managing browsing history, etc.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Device Fingerprinting</h3>
                    <p>
                      A technology for identifying by combining browser and device setting information.
                      Used for detecting unauthorized use and improving security.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 7 (Obtaining and Changing Consent)</h2>
                <p className="mb-3">
                  The Company requests consent to Cookie use when using the Service for the first time.
                  Users can change the content of their consent in the following ways:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Delete or disable Cookies from browser settings</li>
                  <li>Change Cookie settings from the Service's settings screen</li>
                  <li>Disable advertising Cookies from the above opt-out links</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 8 (Relationship with Privacy Policy)</h2>
                <p>
                  Please read this policy in conjunction with our
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline mx-1">
                    Privacy Policy
                  </a>. Information obtained through Cookies and similar technologies will be
                  properly managed in accordance with the Privacy Policy.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 9 (Policy Changes)</h2>
                <p>
                  The Company may change this policy in accordance with changes in laws and regulations or service improvements.
                  The changed policy shall take effect from the time it is posted on this website.
                  In the case of important changes, we will notify you within the Service.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Article 10 (Inquiries)</h2>
                <p className="mb-4">
                  For inquiries regarding this policy, please contact the following:
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold">Queue Inc.</p>
                  <p>Cookie Management</p>
                  <p>Email: privacy@appexit.jp</p>
                  <p>Address: THE HUB Ginza OCT, 8-17-5 Ginza, Chuo-ku, Tokyo 104-0061, Japan</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Established: November 1, 2025</p>
              <p className="text-sm text-gray-500">Last Revised: November 1, 2025</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

