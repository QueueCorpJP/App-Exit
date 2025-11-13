export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-bold mb-12 text-center">情報セキュリティ基本方針</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Queue株式会社（以下「当社」といいます。）は、アプリ・Webサービス売買プラットフォーム「APPEXIT」を運営する企業として、
              お客様の個人情報、取引情報、アプリ・サービスの機密情報など、
              当社が取り扱うすべての情報資産の機密性、完全性、可用性を確保するため、
              情報セキュリティマネジメントシステムを確立し、継続的に改善することを宣言いたします。
            </p>

            <div className="space-y-8">
              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">基本方針</h2>
                <p className="text-gray-700 mb-3 font-medium">
                  当社は、情報セキュリティの確保を経営上の重要課題と認識し、以下の基本方針を定めます。
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>情報資産を適切に管理し、不正アクセス、漏洩、改ざん、紛失、破壊から保護します</li>
                  <li>情報セキュリティに関する法令、規制、契約上の義務を遵守します</li>
                  <li>情報セキュリティマネジメントシステムを確立し、継続的に改善します</li>
                  <li>全従業員に対して情報セキュリティ教育を実施します</li>
                  <li>情報セキュリティインシデントの予防と迅速な対応を行います</li>
                </ol>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 適用範囲</h2>
                <p className="text-gray-700 mb-4">
                  本方針は、当社が取り扱うすべての情報資産に適用されます。
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">対象となる情報資産</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>お客様の個人情報（氏名、住所、電話番号、メールアドレス、決済情報等）</li>
                      <li>取引情報（売買契約内容、取引履歴、決済情報等）</li>
                      <li>アプリ・Webサービスの機密情報（ソースコード、技術情報、ユーザーデータ等）</li>
                      <li>当社の機密情報（経営情報、営業情報、技術情報等）</li>
                      <li>従業員の個人情報</li>
                      <li>その他当社が取り扱うすべての情報</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">対象者</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>当社の全役員・従業員</li>
                      <li>業務委託先、協力会社等の関係者</li>
                      <li>その他当社の情報資産を取り扱うすべての者</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 情報セキュリティ管理体制</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）組織体制</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>最高情報セキュリティ責任者（CISO）の設置</li>
                      <li>情報セキュリティ委員会の設置と定期的な開催</li>
                      <li>各部門における情報セキュリティ責任者の配置</li>
                      <li>セキュリティインシデント対応チーム（CSIRT）の設置</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）役割と責任</h3>
                    <div className="space-y-3 ml-4">
                      <div>
                        <p className="font-medium text-gray-800">最高情報セキュリティ責任者（CISO）</p>
                        <p className="text-gray-700 text-sm">
                          情報セキュリティマネジメントシステム全体の統括、
                          情報セキュリティ方針の策定と承認
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">情報セキュリティ委員会</p>
                        <p className="text-gray-700 text-sm">
                          情報セキュリティに関する重要事項の審議、
                          インシデント対応の指揮
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">部門責任者</p>
                        <p className="text-gray-700 text-sm">
                          所管部門における情報セキュリティ対策の実施と管理
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">全従業員</p>
                        <p className="text-gray-700 text-sm">
                          本方針および関連規程の遵守、日常業務における情報セキュリティの実践
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 情報資産の管理</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）情報資産の分類と管理</h3>
                    <p className="text-gray-700 mb-2">
                      情報資産を重要度に応じて以下のように分類し、適切に管理します。
                    </p>
                    <div className="space-y-2 ml-4">
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">機密情報（最重要）</p>
                        <p className="text-gray-700 text-sm">
                          漏洩した場合に当社または顧客に重大な影響を及ぼす情報
                          <br />
                          例：お客様の個人情報、決済情報、アプリのソースコード等
                        </p>
                      </div>
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">重要情報</p>
                        <p className="text-gray-700 text-sm">
                          漏洩した場合に当社または顧客に影響を及ぼす情報
                          <br />
                          例：取引履歴、社内システムの設定情報等
                        </p>
                      </div>
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">一般情報</p>
                        <p className="text-gray-700 text-sm">
                          公開されている情報や業務上一般的に取り扱われる情報
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）情報資産の取り扱い</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>情報資産の取得、利用、保管、廃棄に関する規程の策定と遵守</li>
                      <li>アクセス権限の適切な設定と定期的な見直し</li>
                      <li>重要情報の暗号化</li>
                      <li>情報資産の持ち出しに関する承認手続きの徹底</li>
                      <li>不要となった情報の安全な廃棄</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 技術的セキュリティ対策</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）システムセキュリティ</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>ファイアウォール、IDS/IPSの導入と運用</li>
                      <li>最新のセキュリティパッチの適用</li>
                      <li>ウイルス対策ソフトの導入と定期的な更新</li>
                      <li>システムの脆弱性診断の定期実施</li>
                      <li>ログの記録と監視</li>
                      <li>WAF（Web Application Firewall）の導入</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）アクセス制御</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>多要素認証の導入</li>
                      <li>強固なパスワードポリシーの適用</li>
                      <li>最小権限の原則に基づくアクセス権限の付与</li>
                      <li>特権IDの厳格な管理</li>
                      <li>アクセスログの記録と監視</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（3）暗号化</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>通信の暗号化（SSL/TLS）</li>
                      <li>データベースの暗号化</li>
                      <li>保管データの暗号化</li>
                      <li>バックアップデータの暗号化</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（4）バックアップ</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>重要データの定期的なバックアップ</li>
                      <li>バックアップデータの安全な保管</li>
                      <li>復旧手順の確立と定期的なテスト</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 物理的セキュリティ対策</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>オフィスへの入退室管理（ICカード、生体認証等）</li>
                  <li>サーバールームの施錠と入退室記録</li>
                  <li>監視カメラの設置</li>
                  <li>重要書類の施錠管理</li>
                  <li>機器の持ち出し管理</li>
                  <li>クリアデスク・クリアスクリーンの徹底</li>
                  <li>来訪者の管理</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 人的セキュリティ対策</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）教育・研修</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>全従業員に対する情報セキュリティ教育の定期実施（年2回以上）</li>
                      <li>新入社員向けセキュリティ研修の実施</li>
                      <li>役職や業務内容に応じた専門的な教育</li>
                      <li>標的型メール攻撃訓練の実施</li>
                      <li>最新のセキュリティ脅威に関する情報共有</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）雇用管理</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>採用時における適切なバックグラウンドチェック</li>
                      <li>入社時の秘密保持契約の締結</li>
                      <li>退職時の情報資産返却と退職後の守秘義務の確認</li>
                      <li>アクセス権限の速やかな削除</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（3）業務委託先の管理</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>委託先の情報セキュリティ体制の確認</li>
                      <li>秘密保持契約の締結</li>
                      <li>委託先の定期的な監査</li>
                      <li>再委託の制限と管理</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. インシデント対応</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）インシデントの定義</h3>
                    <p className="text-gray-700 mb-2">
                      以下のような事象をセキュリティインシデントとして定義します。
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>個人情報や機密情報の漏洩、紛失</li>
                      <li>不正アクセス、サイバー攻撃</li>
                      <li>マルウェア感染</li>
                      <li>システム障害</li>
                      <li>情報資産の改ざん、破壊</li>
                      <li>その他情報セキュリティに関する重大な事象</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）対応手順</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        <span className="font-medium">検知・報告：</span>
                        インシデントを発見した場合は、直ちに上長および情報セキュリティ委員会に報告
                      </li>
                      <li>
                        <span className="font-medium">初動対応：</span>
                        被害の拡大防止措置（ネットワーク遮断、アカウント停止等）
                      </li>
                      <li>
                        <span className="font-medium">調査・分析：</span>
                        原因究明と影響範囲の特定
                      </li>
                      <li>
                        <span className="font-medium">復旧：</span>
                        システムやデータの復旧作業
                      </li>
                      <li>
                        <span className="font-medium">報告：</span>
                        関係者への通知、必要に応じた監督官庁や警察への届出
                      </li>
                      <li>
                        <span className="font-medium">再発防止：</span>
                        原因分析に基づく再発防止策の実施
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 事業継続管理</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>事業継続計画（BCP）の策定</li>
                  <li>災害時における重要業務の継続手順の確立</li>
                  <li>定期的な訓練とBCPの見直し</li>
                  <li>バックアップサイトの確保</li>
                  <li>緊急連絡体制の整備</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. 法令遵守</h2>
                <p className="text-gray-700 mb-3">
                  当社は、以下の法令を遵守し、情報セキュリティを確保します。
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>個人情報保護法</li>
                  <li>不正アクセス禁止法</li>
                  <li>電気通信事業法</li>
                  <li>サイバーセキュリティ基本法</li>
                  <li>不正競争防止法</li>
                  <li>刑法（電磁的記録不正作出罪等）</li>
                  <li>その他関連法令</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. 監査と継続的改善</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">内部監査</h3>
                    <p className="text-gray-700">
                      情報セキュリティマネジメントシステムの有効性を検証するため、
                      定期的に内部監査を実施し、改善点を特定します。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">外部監査・認証</h3>
                    <p className="text-gray-700">
                      必要に応じて外部機関による監査を受け、
                      ISO/IEC 27001等の国際規格の認証取得を目指します。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">継続的改善</h3>
                    <p className="text-gray-700">
                      PDCAサイクルに基づき、情報セキュリティマネジメントシステムを
                      継続的に改善します。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. お客様へのお願い</h2>
                <p className="text-gray-700 mb-4">
                  APPEXITをご利用のお客様には、以下の点にご協力をお願いいたします。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>強固なパスワードの設定と定期的な変更</li>
                  <li>パスワードの適切な管理（他人への共有禁止）</li>
                  <li>二要素認証の有効化</li>
                  <li>不審なメールやリンクへの注意</li>
                  <li>ソフトウェアやOSの最新化</li>
                  <li>セキュリティインシデントを発見した場合の速やかな報告</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. お問い合わせ</h2>
                <p className="text-gray-700 mb-4">
                  情報セキュリティに関するお問い合わせは、以下までお願いいたします。
                </p>
                <div className="p-4 rounded">
                  <p className="text-gray-700 font-semibold">Queue株式会社</p>
                  <p className="text-gray-700">情報セキュリティ管理責任者</p>
                  <p className="text-gray-700">メールアドレス：security@appexit.jp</p>
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

