import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function SecurityPolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
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
          <h1 className="text-2xl font-bold mb-12 text-center">{tp('security.title')}</h1>

          {locale === 'ja' ? (
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
          ) : (
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Queue Co., Ltd. (hereinafter referred to as "the Company") operates APPEXIT, an application and web service trading platform.
              We hereby declare that we have established and will continuously improve an Information Security Management System
              to ensure the confidentiality, integrity, and availability of all information assets handled by the Company,
              including customers' personal information, transaction information, and confidential information of applications and services.
            </p>

            <div className="space-y-8">
              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Policy</h2>
                <p className="text-gray-700 mb-3 font-medium">
                  The Company recognizes information security as a critical management issue and establishes the following basic policy.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>Properly manage information assets and protect them from unauthorized access, leakage, tampering, loss, and destruction</li>
                  <li>Comply with laws, regulations, and contractual obligations related to information security</li>
                  <li>Establish and continuously improve the Information Security Management System</li>
                  <li>Provide information security education to all employees</li>
                  <li>Prevent information security incidents and respond promptly</li>
                </ol>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Scope of Application</h2>
                <p className="text-gray-700 mb-4">
                  This policy applies to all information assets handled by the Company.
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Covered Information Assets</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Customer personal information (name, address, phone number, email address, payment information, etc.)</li>
                      <li>Transaction information (sales contract details, transaction history, payment information, etc.)</li>
                      <li>Confidential information of applications and web services (source code, technical information, user data, etc.)</li>
                      <li>Company confidential information (management information, business information, technical information, etc.)</li>
                      <li>Employee personal information</li>
                      <li>All other information handled by the Company</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Covered Persons</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>All officers and employees of the Company</li>
                      <li>Business partners, contractors, and related parties</li>
                      <li>All other persons handling the Company's information assets</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information Security Management Structure</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(1) Organizational Structure</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Appointment of Chief Information Security Officer (CISO)</li>
                      <li>Establishment and regular meetings of Information Security Committee</li>
                      <li>Designation of information security officers in each department</li>
                      <li>Establishment of Computer Security Incident Response Team (CSIRT)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(2) Roles and Responsibilities</h3>
                    <div className="space-y-3 ml-4">
                      <div>
                        <p className="font-medium text-gray-800">Chief Information Security Officer (CISO)</p>
                        <p className="text-gray-700 text-sm">
                          Overall management of the Information Security Management System,
                          formulation and approval of information security policies
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Information Security Committee</p>
                        <p className="text-gray-700 text-sm">
                          Deliberation on important matters related to information security,
                          direction of incident response
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Department Heads</p>
                        <p className="text-gray-700 text-sm">
                          Implementation and management of information security measures within their departments
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">All Employees</p>
                        <p className="text-gray-700 text-sm">
                          Compliance with this policy and related regulations, practice of information security in daily work
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Asset Management</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(1) Classification and Management of Information Assets</h3>
                    <p className="text-gray-700 mb-2">
                      Information assets are classified according to their importance and managed appropriately as follows.
                    </p>
                    <div className="space-y-2 ml-4">
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">Confidential Information (Highest Importance)</p>
                        <p className="text-gray-700 text-sm">
                          Information that would have serious impact on the Company or customers if leaked
                          <br />
                          Examples: Customer personal information, payment information, application source code, etc.
                        </p>
                      </div>
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">Important Information</p>
                        <p className="text-gray-700 text-sm">
                          Information that would impact the Company or customers if leaked
                          <br />
                          Examples: Transaction history, internal system configuration information, etc.
                        </p>
                      </div>
                      <div className="border-0 rounded p-3">
                        <p className="font-medium text-gray-800">General Information</p>
                        <p className="text-gray-700 text-sm">
                          Publicly available information or information generally handled in business operations
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(2) Handling of Information Assets</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Formulation and compliance with regulations on acquisition, use, storage, and disposal of information assets</li>
                      <li>Appropriate setting and periodic review of access permissions</li>
                      <li>Encryption of important information</li>
                      <li>Thorough approval procedures for removal of information assets</li>
                      <li>Safe disposal of unnecessary information</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Technical Security Measures</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(1) System Security</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Implementation and operation of firewalls, IDS/IPS</li>
                      <li>Application of latest security patches</li>
                      <li>Implementation and regular updates of antivirus software</li>
                      <li>Regular vulnerability assessments of systems</li>
                      <li>Log recording and monitoring</li>
                      <li>Implementation of WAF (Web Application Firewall)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(2) Access Control</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Implementation of multi-factor authentication</li>
                      <li>Application of strong password policies</li>
                      <li>Granting of access permissions based on the principle of least privilege</li>
                      <li>Strict management of privileged IDs</li>
                      <li>Recording and monitoring of access logs</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(3) Encryption</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Communication encryption (SSL/TLS)</li>
                      <li>Database encryption</li>
                      <li>Encryption of stored data</li>
                      <li>Encryption of backup data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(4) Backup</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Regular backups of important data</li>
                      <li>Safe storage of backup data</li>
                      <li>Establishment of recovery procedures and regular testing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Physical Security Measures</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Office access control (IC cards, biometric authentication, etc.)</li>
                  <li>Server room locking and access logs</li>
                  <li>Installation of surveillance cameras</li>
                  <li>Locked storage of important documents</li>
                  <li>Equipment removal management</li>
                  <li>Enforcement of clear desk and clear screen policies</li>
                  <li>Visitor management</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Human Security Measures</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(1) Education and Training</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Regular information security education for all employees (at least twice a year)</li>
                      <li>Security training for new employees</li>
                      <li>Specialized education based on position and job responsibilities</li>
                      <li>Targeted email attack drills</li>
                      <li>Information sharing on latest security threats</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(2) Employment Management</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Appropriate background checks during hiring</li>
                      <li>Signing of confidentiality agreements upon employment</li>
                      <li>Return of information assets upon resignation and confirmation of post-employment confidentiality obligations</li>
                      <li>Prompt deletion of access permissions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(3) Contractor Management</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Verification of contractors' information security systems</li>
                      <li>Signing of confidentiality agreements</li>
                      <li>Regular audits of contractors</li>
                      <li>Restrictions and management of subcontracting</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Incident Response</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(1) Definition of Incidents</h3>
                    <p className="text-gray-700 mb-2">
                      The following events are defined as security incidents.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Leakage or loss of personal information or confidential information</li>
                      <li>Unauthorized access, cyber attacks</li>
                      <li>Malware infection</li>
                      <li>System failures</li>
                      <li>Tampering or destruction of information assets</li>
                      <li>Other serious events related to information security</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">(2) Response Procedures</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                      <li>
                        <span className="font-medium">Detection and Reporting:</span>
                        Immediately report to supervisor and Information Security Committee upon discovering an incident
                      </li>
                      <li>
                        <span className="font-medium">Initial Response:</span>
                        Take measures to prevent spread of damage (network disconnection, account suspension, etc.)
                      </li>
                      <li>
                        <span className="font-medium">Investigation and Analysis:</span>
                        Identify root cause and scope of impact
                      </li>
                      <li>
                        <span className="font-medium">Recovery:</span>
                        System and data recovery operations
                      </li>
                      <li>
                        <span className="font-medium">Notification:</span>
                        Notify relevant parties, report to supervisory authorities and police as necessary
                      </li>
                      <li>
                        <span className="font-medium">Recurrence Prevention:</span>
                        Implement recurrence prevention measures based on cause analysis
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Business Continuity Management</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Formulation of Business Continuity Plan (BCP)</li>
                  <li>Establishment of procedures for continuing critical operations during disasters</li>
                  <li>Regular drills and BCP reviews</li>
                  <li>Securing of backup sites</li>
                  <li>Establishment of emergency contact systems</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Legal Compliance</h2>
                <p className="text-gray-700 mb-3">
                  The Company complies with the following laws to ensure information security.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>Act on the Protection of Personal Information</li>
                  <li>Unauthorized Computer Access Law</li>
                  <li>Telecommunications Business Act</li>
                  <li>Cybersecurity Basic Act</li>
                  <li>Unfair Competition Prevention Act</li>
                  <li>Penal Code (crimes related to unauthorized creation of electromagnetic records, etc.)</li>
                  <li>Other related laws and regulations</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Audit and Continuous Improvement</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Internal Audit</h3>
                    <p className="text-gray-700">
                      To verify the effectiveness of the Information Security Management System,
                      internal audits are conducted regularly to identify areas for improvement.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">External Audit and Certification</h3>
                    <p className="text-gray-700">
                      We undergo audits by external organizations as necessary and
                      aim to obtain certification for international standards such as ISO/IEC 27001.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Continuous Improvement</h3>
                    <p className="text-gray-700">
                      Based on the PDCA cycle, we continuously improve our
                      Information Security Management System.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Request to Customers</h2>
                <p className="text-gray-700 mb-4">
                  We ask customers using APPEXIT to cooperate with the following points.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Set strong passwords and change them regularly</li>
                  <li>Properly manage passwords (prohibition of sharing with others)</li>
                  <li>Enable two-factor authentication</li>
                  <li>Be cautious of suspicious emails and links</li>
                  <li>Keep software and OS up to date</li>
                  <li>Promptly report any security incidents discovered</li>
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Inquiries</h2>
                <p className="text-gray-700 mb-4">
                  For inquiries regarding information security, please contact us at the following.
                </p>
                <div className="p-4 rounded">
                  <p className="text-gray-700 font-semibold">Queue Co., Ltd.</p>
                  <p className="text-gray-700">Information Security Manager</p>
                  <p className="text-gray-700">Email: security@appexit.jp</p>
                  <p className="text-gray-700">Address: THE HUB Ginza OCT, 8-17-5 Ginza, Chuo-ku, Tokyo 104-0061</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Enacted: November 1, 2025</p>
              <p className="text-sm text-gray-500">Last Revised: November 1, 2025</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
