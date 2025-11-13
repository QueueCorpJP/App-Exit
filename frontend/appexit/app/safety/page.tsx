export default function SafetyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-bold mb-12 text-center">安全管理方針</h1>

          <div className="prose max-w-none">
            <p className="mb-8">
              Queue株式会社（以下「当社」といいます。）は、アプリ・Webサービス売買プラットフォーム「APPEXIT」を運営する企業として、
              お客様に安全・安心なサービスを提供することを最優先に考え、
              包括的な安全管理体制を構築し、継続的に改善することを宣言いたします。
            </p>

            <div className="space-y-8">
              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">基本方針</h2>
                <p className="mb-3 font-medium">
                  当社は、利用者の安全確保を経営上の最重要課題と認識し、以下の基本方針を定めます。
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>利用者の生命、身体、財産の安全を最優先に考えた運営を行います</li>
                  <li>安全に関する法令、規制、業界基準を遵守します</li>
                  <li>リスク評価と予防措置を継続的に実施します</li>
                  <li>全従業員に対して安全管理教育を実施します</li>
                  <li>緊急時の迅速な対応体制を整備します</li>
                </ol>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">1. 適用範囲</h2>
                <p className="mb-4">
                  本方針は、APPEXITサービスに関わるすべての業務活動に適用されます。
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">対象範囲</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>プラットフォーム上での取引の安全性確保</li>
                      <li>個人情報および機密情報の保護</li>
                      <li>不正取引・詐欺行為の防止</li>
                      <li>システムの安全性と信頼性の確保</li>
                      <li>お客様サポート体制の整備</li>
                      <li>従業員の安全と健康の確保</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">対象者</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>当社の全役員・従業員</li>
                      <li>APPEXITサービスの利用者</li>
                      <li>業務委託先、協力会社等の関係者</li>
                      <li>その他当社サービスに関わるすべての者</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">2. 安全管理体制</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）組織体制</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>最高安全管理責任者（CSO）の設置</li>
                      <li>安全管理委員会の設置と定期的な開催</li>
                      <li>各部門における安全管理責任者の配置</li>
                      <li>緊急対応チームの設置</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）役割と責任</h3>
                    <div className="space-y-3 ml-4">
                      <div>
                        <p className="font-medium">最高安全管理責任者（CSO）</p>
                        <p className="text-sm">
                          安全管理体制全体の統括、安全管理方針の策定と承認
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">安全管理委員会</p>
                        <p className="text-sm">
                          安全に関する重要事項の審議、緊急時対応の指揮
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">部門責任者</p>
                        <p className="text-sm">
                          所管部門における安全対策の実施と管理
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">全従業員</p>
                        <p className="text-sm">
                          本方針および関連規程の遵守、日常業務における安全の実践
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">3. 取引の安全性確保</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）本人確認・審査</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>厳格な本人確認手続き（KYC）の実施</li>
                      <li>売り手・買い手の適格性審査</li>
                      <li>法人の場合は登記情報の確認</li>
                      <li>反社会的勢力の排除</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）取引監視</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>不正取引の検知システムの導入</li>
                      <li>取引パターンの異常検知</li>
                      <li>24時間365日の監視体制</li>
                      <li>疑わしい取引の報告と調査</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）エスクローサービス</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>安全な代金決済の仕組みの提供</li>
                      <li>取引完了まで当社が代金を預かり</li>
                      <li>トラブル時の仲裁機能</li>
                      <li>返金プロセスの明確化</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">4. 詐欺・不正行為の防止</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）予防措置</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>出品内容の事前審査</li>
                      <li>アプリ・サービスの実在性確認</li>
                      <li>虚偽情報の検知と削除</li>
                      <li>利用者への注意喚起と教育</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）禁止事項の明確化</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>虚偽の情報掲載の禁止</li>
                      <li>第三者の権利を侵害する出品の禁止</li>
                      <li>違法なアプリ・サービスの取引禁止</li>
                      <li>マネーロンダリング目的の利用禁止</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）通報・相談窓口</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>24時間受付の通報窓口の設置</li>
                      <li>匿名での通報も受付</li>
                      <li>通報内容の迅速な調査</li>
                      <li>通報者の保護</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">5. データ保護とプライバシー</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）個人情報の保護</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>個人情報保護法の完全遵守</li>
                      <li>必要最小限の情報のみ取得</li>
                      <li>適切なアクセス制限</li>
                      <li>暗号化による保護</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）情報の取り扱い</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>利用目的の明示</li>
                      <li>第三者提供時の同意取得</li>
                      <li>安全管理措置の実施</li>
                      <li>定期的な情報の見直しと削除</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">6. システムの安全性</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）システムセキュリティ</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>SSL/TLS暗号化通信の実施</li>
                      <li>DDoS攻撃対策</li>
                      <li>定期的な脆弱性診断</li>
                      <li>セキュリティパッチの迅速な適用</li>
                      <li>WAF（Web Application Firewall）の導入</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）可用性の確保</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>冗長化されたシステム構成</li>
                      <li>定期的なバックアップ</li>
                      <li>災害復旧計画（DRP）の策定</li>
                      <li>サービス稼働率99.9%以上の維持</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）監視体制</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>24時間365日のシステム監視</li>
                      <li>異常の自動検知と通知</li>
                      <li>アクセスログの記録と分析</li>
                      <li>定期的な監査</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">7. 緊急時対応</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）緊急事態の定義</h3>
                    <p className="mb-2">
                      以下のような事象を緊急事態として定義します。
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>重大なセキュリティインシデント</li>
                      <li>大規模なシステム障害</li>
                      <li>詐欺・不正行為の発生</li>
                      <li>自然災害等による業務停止</li>
                      <li>その他利用者の安全を脅かす事象</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）対応手順</h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        <span className="font-medium">検知・報告：</span>
                        緊急事態を発見した場合は、直ちに緊急対応チームに報告
                      </li>
                      <li>
                        <span className="font-medium">初動対応：</span>
                        被害の拡大防止と利用者の安全確保
                      </li>
                      <li>
                        <span className="font-medium">状況確認：</span>
                        被害状況と影響範囲の把握
                      </li>
                      <li>
                        <span className="font-medium">対策実施：</span>
                        問題の解決と復旧作業
                      </li>
                      <li>
                        <span className="font-medium">情報開示：</span>
                        利用者への適切な情報提供
                      </li>
                      <li>
                        <span className="font-medium">再発防止：</span>
                        原因分析と改善策の実施
                      </li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）連絡体制</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>緊急連絡網の整備</li>
                      <li>関係機関との連携体制</li>
                      <li>利用者への迅速な情報提供</li>
                      <li>プレスリリースの発信体制</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">8. 教育・研修</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）従業員教育</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>全従業員に対する安全管理教育の定期実施（年2回以上）</li>
                      <li>新入社員向け安全研修の実施</li>
                      <li>職種別の専門的な教育</li>
                      <li>緊急時対応訓練の実施</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）利用者啓発</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>安全な取引方法のガイド提供</li>
                      <li>詐欺手口の注意喚起</li>
                      <li>セキュリティに関する情報発信</li>
                      <li>FAQ・サポート記事の充実</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">9. 法令遵守</h2>
                <p className="mb-3">
                  当社は、以下の法令を遵守し、安全な運営を行います。
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>個人情報保護法</li>
                  <li>特定商取引法</li>
                  <li>資金決済法</li>
                  <li>犯罪収益移転防止法</li>
                  <li>消費者契約法</li>
                  <li>不正アクセス禁止法</li>
                  <li>電気通信事業法</li>
                  <li>その他関連法令</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">10. 継続的改善</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">定期的な見直し</h3>
                    <p>
                      安全管理体制の有効性を検証するため、
                      定期的に内部監査を実施し、改善点を特定します。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">リスク評価</h3>
                    <p>
                      新たなリスクや脅威を継続的に評価し、
                      必要に応じて対策を強化します。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">PDCAサイクル</h3>
                    <p>
                      Plan（計画）、Do（実行）、Check（評価）、Act（改善）のサイクルに基づき、
                      安全管理体制を継続的に改善します。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">11. お客様へのお願い</h2>
                <p className="mb-4">
                  APPEXITをより安全にご利用いただくため、以下の点にご協力をお願いいたします。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>出品内容・取引内容の正確な記載</li>
                  <li>取引相手の評価・レビューの確認</li>
                  <li>不審な取引の回避</li>
                  <li>プラットフォーム外での直接取引の禁止</li>
                  <li>パスワードの適切な管理</li>
                  <li>二要素認証の有効化</li>
                  <li>不審な活動を発見した場合の速やかな報告</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">12. お問い合わせ</h2>
                <p className="mb-4">
                  安全管理に関するお問い合わせや不審な活動の通報は、以下までお願いいたします。
                </p>
                <div className="p-4 rounded">
                  <p className="font-semibold">Queue株式会社</p>
                  <p>安全管理責任者</p>
                  <p>メールアドレス：safety@appexit.jp</p>
                  <p>緊急通報窓口：support@appexit.jp（24時間受付）</p>
                  <p>住所：〒104-0061 東京都中央区銀座８丁目17-5 THE HUB 銀座 OCT</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm">制定日：2025年11月1日</p>
              <p className="text-sm">最終改訂日：2025年11月1日</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
