import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function CompliancePolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
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
          <h1 className="text-2xl font-extrabold mb-12 text-center">{tp('compliance.title')}</h1>

          {locale === 'ja' ? (
            <div className="prose max-w-none">
            <p className="mb-8">
              Queue株式会社（以下「当社」といいます。）は、アプリ・Webサービス売買プラットフォーム「APPEXIT」を運営する企業として、
              市民社会の秩序や安全に脅威を与える反社会的勢力とは一切の関係を持たず、
              また、反社会的勢力による不当要求に対しては、毅然とした態度で対応することをここに宣言いたします。
            </p>

            <div className="space-y-8">
              <div className="bg-red-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">基本方針</h2>
                <p className="mb-3 font-medium">
                  当社は、反社会的勢力に対し、以下の基本方針を遵守いたします。
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>組織全体として反社会的勢力との関係を遮断します</li>
                  <li>反社会的勢力による不当要求は拒絶します</li>
                  <li>取引を含めた一切の関係を持ちません</li>
                  <li>有事における民事・刑事の法的対応を行います</li>
                  <li>裏取引や資金提供は絶対に行いません</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">1. 反社会的勢力の定義</h2>
                <p className="mb-4">
                  当社が定義する「反社会的勢力」とは、以下のような個人または団体を指します。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>暴力団（暴力団員による不当な行為の防止等に関する法律第2条第2号に規定する暴力団）</li>
                  <li>暴力団員（同法第2条第6号に規定する暴力団員）</li>
                  <li>暴力団準構成員</li>
                  <li>暴力団関係企業</li>
                  <li>総会屋、社会運動標ぼうゴロ、政治活動標ぼうゴロ</li>
                  <li>特殊知能暴力集団</li>
                  <li>その他前各号に準ずる者</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">2. 反社会的勢力排除のための取り組み</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）組織的な対応体制の整備</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>反社会的勢力対応を統括する部署および責任者を設置</li>
                      <li>コンプライアンス委員会における定期的な検討</li>
                      <li>全従業員への教育・研修の実施</li>
                      <li>対応マニュアルの整備と周知徹底</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）外部専門機関との連携</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>警察、暴力追放運動推進センター、弁護士等との連携体制の構築</li>
                      <li>情報の収集・管理体制の整備</li>
                      <li>有事における迅速な相談・通報体制の確立</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）取引先の審査体制</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>新規取引開始時における反社チェックの実施</li>
                      <li>既存取引先の定期的な確認</li>
                      <li>契約書への反社会的勢力排除条項の導入</li>
                      <li>疑わしい取引の監視と報告体制の整備</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（4）プラットフォーム利用者の審査</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>アカウント登録時の本人確認の徹底</li>
                      <li>反社会的勢力に該当する疑いのあるユーザーの審査</li>
                      <li>不審な取引パターンの監視システムの構築</li>
                      <li>通報・報告制度の整備</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">3. 反社会的勢力との関係遮断</h2>
                <p className="mb-4">
                  当社は、反社会的勢力との関係について、以下の対応を実施いたします。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">取引の禁止</h3>
                    <p className="">
                      反社会的勢力との商取引、業務提携、資本関係など、あらゆる取引を行いません。
                      また、既存の取引先が反社会的勢力であることが判明した場合は、直ちに取引を解消いたします。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">プラットフォーム利用の禁止</h3>
                    <p className="">
                      反社会的勢力によるAPPEXITの利用を一切認めません。
                      利用者が反社会的勢力であることが判明した場合は、直ちにアカウントを停止し、
                      利用規約に基づき契約を解除いたします。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">資金提供の禁止</h3>
                    <p className="">
                      反社会的勢力への資金提供、政治献金、寄付、協賛金その他名目の如何を問わず、
                      いかなる形であっても利益供与を行いません。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">不当要求の拒絶</h3>
                    <p className="">
                      反社会的勢力からの不当要求に対しては、担当者個人の判断で対応せず、
                      組織として毅然とした態度で対応し、一切の要求を拒絶いたします。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">4. 契約書への反社条項の導入</h2>
                <p className="mb-4">
                  当社は、契約書に以下の内容を含む反社会的勢力排除条項を導入しております。
                </p>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">表明保証条項</h4>
                    <p className=" text-sm">
                      契約当事者が、自己および自己の役員が反社会的勢力ではないこと、
                      また反社会的勢力と関係を有していないことを表明し保証する条項
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">契約解除条項</h4>
                    <p className=" text-sm">
                      契約当事者が反社会的勢力であることが判明した場合、または反社会的勢力と関係を有することが判明した場合に、
                      相手方が催告なしに契約を解除できる条項
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">損害賠償条項</h4>
                    <p className=" text-sm">
                      契約解除により相手方に損害が生じた場合、当該損害を賠償する責任を負う条項
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">5. 不当要求への対応</h2>
                <p className="mb-4">
                  反社会的勢力から不当な要求を受けた場合、以下の対応を実施いたします。
                </p>
                <ol className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <span className="font-medium">組織的対応：</span>
                    担当者一人で対応せず、必ず複数名で対応し、対応責任者に報告
                  </li>
                  <li>
                    <span className="font-medium">記録の作成：</span>
                    面談や電話の内容を詳細に記録し、可能な限り録音・録画を実施
                  </li>
                  <li>
                    <span className="font-medium">毅然とした対応：</span>
                    不当な要求には明確に拒絶の意思を表明し、要求には一切応じない
                  </li>
                  <li>
                    <span className="font-medium">外部専門機関への相談：</span>
                    警察、弁護士等の外部専門機関に速やかに相談し、適切な助言を受ける
                  </li>
                  <li>
                    <span className="font-medium">法的措置：</span>
                    必要に応じて、民事・刑事の法的措置を講じる
                  </li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">6. 疑わしい取引の監視</h2>
                <p className="mb-4">
                  APPEXITプラットフォーム上での以下のような疑わしい取引を監視し、
                  反社会的勢力による利用を防止いたします。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>異常に高額または低額な取引</li>
                  <li>実態の不明確なアプリ・サービスの売買</li>
                  <li>短期間での頻繁な取引</li>
                  <li>複数アカウントを使用した疑わしい行為</li>
                  <li>マネーロンダリングの疑いがある取引</li>
                  <li>その他、不自然または不審な取引パターン</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">7. 従業員への教育</h2>
                <p className="mb-4">
                  当社は、全従業員に対して以下の教育・研修を実施しております。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>反社会的勢力に関する基礎知識</li>
                  <li>反社会的勢力の見分け方と対応方法</li>
                  <li>不当要求を受けた場合の初動対応</li>
                  <li>社内報告・連絡体制の周知</li>
                  <li>実際の事例に基づいた対応訓練</li>
                  <li>関連法令およびコンプライアンスの理解</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">8. 利用者の皆様へのお願い</h2>
                <p className="mb-4">
                  APPEXITをご利用の皆様には、以下の点についてご協力をお願いいたします。
                </p>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">登録情報の正確性</h4>
                    <p className="">
                      アカウント登録時には、正確な情報をご提供ください。
                      虚偽の情報による登録は、アカウント停止の対象となります。
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">不審な取引の報告</h4>
                    <p className="">
                      反社会的勢力と疑われるユーザーや、不審な取引を発見した場合は、
                      速やかに当社までご報告ください。
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">利用規約の遵守</h4>
                    <p className="">
                      APPEXITの利用規約を遵守し、健全な取引環境の維持にご協力ください。
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">9. 関連法令の遵守</h2>
                <p className=" mb-3">
                  当社は、以下の法令を遵守し、反社会的勢力との関係を遮断いたします。
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>暴力団員による不当な行為の防止等に関する法律</li>
                  <li>組織的な犯罪の処罰及び犯罪収益の規制等に関する法律</li>
                  <li>犯罪による収益の移転防止に関する法律</li>
                  <li>刑法（恐喝罪、脅迫罪等）</li>
                  <li>各都道府県の暴力団排除条例</li>
                  <li>金融商品取引法</li>
                  <li>その他関連法令</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">10. 通報・相談窓口</h2>
                <p className="mb-4">
                  反社会的勢力に関する情報提供や相談は、以下の窓口までお願いいたします。
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">社内窓口</h4>
                    <p className="">
                      Queue株式会社 コンプライアンス部
                      <br />
                      メールアドレス：compliance@appexit.jp
                      <br />
                      電話番号：03-5324-2678（平日 10:00～18:00）
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">外部窓口</h4>
                    <p className="">
                      警察相談専用電話：#9110
                      <br />
                      公益財団法人暴力追放運動推進センター
                      <br />
                      各都道府県警察本部組織犯罪対策課
                    </p>
                  </div>
                </div>
                <p className=" mt-4 text-sm">
                  ※通報者の秘密は厳守いたします。また、通報により不利益な取り扱いを受けることはありません。
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">11. 本方針の見直し</h2>
                <p className="">
                  当社は、社会情勢の変化や法令の改正等に応じて、本方針を適宜見直してまいります。
                  変更があった場合は、本ウェブサイト上で公表いたします。
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm">制定日：2025年11月1日</p>
              <p className="text-sm">最終改訂日：2025年11月1日</p>
            </div>
          </div>
          ) : (
            <div className="prose max-w-none">
            <p className="mb-8">
              Queue Inc. (hereinafter referred to as "the Company"), as an enterprise operating the app and web service trading platform "APPEXIT,"
              hereby declares that it will have no relationship whatsoever with anti-social forces that pose a threat to the order and safety of civil society,
              and that it will respond with a firm attitude to unreasonable demands from anti-social forces.
            </p>

            <div className="space-y-8">
              <div className="bg-red-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Policy</h2>
                <p className="mb-3 font-medium">
                  The Company shall comply with the following basic policies regarding anti-social forces.
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Sever relationships with anti-social forces as an organization</li>
                  <li>Reject unreasonable demands from anti-social forces</li>
                  <li>Maintain no relationship whatsoever, including business transactions</li>
                  <li>Take civil and criminal legal actions in emergencies</li>
                  <li>Never engage in backdoor deals or provide funds</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">1. Definition of Anti-Social Forces</h2>
                <p className="mb-4">
                  "Anti-social forces" as defined by the Company refers to the following individuals or organizations:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Organized crime groups (as defined in Article 2, Paragraph 2 of the Act on Prevention of Unjust Acts by Organized Crime Group Members)</li>
                  <li>Members of organized crime groups (as defined in Article 2, Paragraph 6 of the same Act)</li>
                  <li>Associate members of organized crime groups</li>
                  <li>Companies related to organized crime groups</li>
                  <li>Corporate racketeers, social activists who claim to be social movements, political activists who claim to be political activities</li>
                  <li>Special intelligence organized crime groups</li>
                  <li>Others equivalent to any of the preceding items</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">2. Efforts to Eliminate Anti-Social Forces</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">(1) Establishment of Organizational Response System</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Establishment of a department and person responsible for managing responses to anti-social forces</li>
                      <li>Periodic review by the Compliance Committee</li>
                      <li>Implementation of education and training for all employees</li>
                      <li>Development and thorough dissemination of response manuals</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">(2) Collaboration with External Specialized Institutions</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Establishment of a cooperation system with police, violence eradication promotion centers, lawyers, etc.</li>
                      <li>Development of information collection and management systems</li>
                      <li>Establishment of a rapid consultation and reporting system in emergencies</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">(3) Screening System for Business Partners</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Implementation of anti-social force checks when starting new transactions</li>
                      <li>Periodic verification of existing business partners</li>
                      <li>Introduction of anti-social force elimination clauses in contracts</li>
                      <li>Development of monitoring and reporting systems for suspicious transactions</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">(4) Screening of Platform Users</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Thorough identity verification at account registration</li>
                      <li>Screening of users suspected of being anti-social forces</li>
                      <li>Construction of a monitoring system for suspicious transaction patterns</li>
                      <li>Development of reporting and notification systems</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">3. Severing Relationships with Anti-Social Forces</h2>
                <p className="mb-4">
                  The Company will implement the following measures regarding relationships with anti-social forces.
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Prohibition of Transactions</h3>
                    <p className="">
                      We will not conduct any transactions with anti-social forces, including commercial transactions, business alliances, or capital relationships.
                      If an existing business partner is found to be an anti-social force, we will immediately terminate the transaction.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Prohibition of Platform Use</h3>
                    <p className="">
                      We do not permit the use of APPEXIT by anti-social forces in any way.
                      If a user is found to be an anti-social force, we will immediately suspend the account and
                      terminate the contract based on the Terms of Service.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Prohibition of Fund Provision</h3>
                    <p className="">
                      We will not provide any form of benefit to anti-social forces, regardless of the name,
                      including fund provision, political contributions, donations, sponsorship money, or any other form.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Rejection of Unreasonable Demands</h3>
                    <p className="">
                      Regarding unreasonable demands from anti-social forces, we will not respond at the individual judgment of the person in charge,
                      but will respond as an organization with a firm attitude and reject all demands.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">4. Introduction of Anti-Social Force Clauses in Contracts</h2>
                <p className="mb-4">
                  The Company has introduced anti-social force elimination clauses containing the following content in contracts.
                </p>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Representation and Warranty Clause</h4>
                    <p className=" text-sm">
                      A clause whereby the contracting party represents and warrants that neither the party itself nor its officers are anti-social forces,
                      and that they have no relationship with anti-social forces
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contract Termination Clause</h4>
                    <p className=" text-sm">
                      A clause that allows the other party to terminate the contract without notice if the contracting party is found to be an anti-social force,
                      or if it is found to have a relationship with anti-social forces
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Damages Clause</h4>
                    <p className=" text-sm">
                      A clause that makes the party liable to compensate for damages if the other party suffers damages due to contract termination
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">5. Response to Unreasonable Demands</h2>
                <p className="mb-4">
                  If we receive unreasonable demands from anti-social forces, we will implement the following responses.
                </p>
                <ol className="list-decimal list-inside space-y-3 ml-4">
                  <li>
                    <span className="font-medium">Organizational Response:</span>
                    Do not respond alone as an individual in charge; always respond with multiple people and report to the response manager
                  </li>
                  <li>
                    <span className="font-medium">Record Creation:</span>
                    Record the content of meetings and phone calls in detail, and record and videotape whenever possible
                  </li>
                  <li>
                    <span className="font-medium">Firm Response:</span>
                    Clearly express the intention to reject unreasonable demands and do not comply with any demands
                  </li>
                  <li>
                    <span className="font-medium">Consultation with External Specialized Institutions:</span>
                    Promptly consult with external specialized institutions such as police and lawyers, and receive appropriate advice
                  </li>
                  <li>
                    <span className="font-medium">Legal Measures:</span>
                    Take civil and criminal legal measures as necessary
                  </li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">6. Monitoring Suspicious Transactions</h2>
                <p className="mb-4">
                  We monitor the following suspicious transactions on the APPEXIT platform to prevent use by anti-social forces.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Abnormally high or low value transactions</li>
                  <li>Trading of apps/services with unclear substance</li>
                  <li>Frequent transactions in a short period of time</li>
                  <li>Suspicious behavior using multiple accounts</li>
                  <li>Transactions suspected of money laundering</li>
                  <li>Other unnatural or suspicious transaction patterns</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">7. Employee Education</h2>
                <p className="mb-4">
                  The Company provides the following education and training to all employees.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Basic knowledge about anti-social forces</li>
                  <li>How to identify and respond to anti-social forces</li>
                  <li>Initial response when receiving unreasonable demands</li>
                  <li>Notification of internal reporting and communication systems</li>
                  <li>Response training based on actual cases</li>
                  <li>Understanding of related laws and compliance</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">8. Request to Users</h2>
                <p className="mb-4">
                  We ask for your cooperation on the following points for all users of APPEXIT.
                </p>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">Accuracy of Registration Information</h4>
                    <p className="">
                      Please provide accurate information when registering an account.
                      Registration with false information is subject to account suspension.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">Reporting Suspicious Transactions</h4>
                    <p className="">
                      If you discover users suspected of being anti-social forces or suspicious transactions,
                      please report them to the Company promptly.
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded p-4">
                    <h4 className="font-semibold mb-2">Compliance with Terms of Service</h4>
                    <p className="">
                      Please comply with APPEXIT's Terms of Service and cooperate in maintaining a sound trading environment.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">9. Compliance with Related Laws and Regulations</h2>
                <p className=" mb-3">
                  The Company complies with the following laws and regulations and severs relationships with anti-social forces.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Act on Prevention of Unjust Acts by Organized Crime Group Members</li>
                  <li>Act on Punishment of Organized Crimes and Control of Crime Proceeds</li>
                  <li>Act on Prevention of Transfer of Criminal Proceeds</li>
                  <li>Penal Code (extortion, intimidation, etc.)</li>
                  <li>Ordinances for the elimination of organized crime groups in each prefecture</li>
                  <li>Financial Instruments and Exchange Act</li>
                  <li>Other related laws and regulations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">10. Reporting and Consultation Contact</h2>
                <p className="mb-4">
                  For information provision or consultation regarding anti-social forces, please contact the following:
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">Internal Contact</h4>
                    <p className="">
                      Queue Inc. Compliance Department
                      <br />
                      Email: compliance@appexit.jp
                      <br />
                      Phone: +81-3-5324-2678 (Weekdays 10:00-18:00)
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold mb-2">External Contact</h4>
                    <p className="">
                      Police Consultation Hotline: #9110
                      <br />
                      Public Interest Incorporated Foundation Center for the Elimination of Violence
                      <br />
                      Organized Crime Control Division of Prefectural Police Headquarters in each prefecture
                    </p>
                  </div>
                </div>
                <p className=" mt-4 text-sm">
                  *The confidentiality of informants will be strictly protected. Informants will not be subjected to any disadvantageous treatment as a result of reporting.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">11. Review of This Policy</h2>
                <p className="">
                  The Company will review this policy as appropriate in response to changes in social conditions, revisions of laws and regulations, etc.
                  If there are any changes, they will be published on this website.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm">Established: November 1, 2025</p>
              <p className="text-sm">Last Revised: November 1, 2025</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

