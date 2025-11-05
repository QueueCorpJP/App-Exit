export default function CompliancePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">反社会的勢力に対する基本方針</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              Queue株式会社（以下「当社」といいます。）は、アプリ・Webサービス売買プラットフォーム「APPEXIT」を運営する企業として、
              市民社会の秩序や安全に脅威を与える反社会的勢力とは一切の関係を持たず、
              また、反社会的勢力による不当要求に対しては、毅然とした態度で対応することをここに宣言いたします。
            </p>

            <div className="space-y-8">
              <div className="border border-gray-200 rounded-lg p-6 bg-red-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">基本方針</h2>
                <p className="text-gray-700 mb-3 font-medium">
                  当社は、反社会的勢力に対し、以下の基本方針を遵守いたします。
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                  <li>組織全体として反社会的勢力との関係を遮断します</li>
                  <li>反社会的勢力による不当要求は拒絶します</li>
                  <li>取引を含めた一切の関係を持ちません</li>
                  <li>有事における民事・刑事の法的対応を行います</li>
                  <li>裏取引や資金提供は絶対に行いません</li>
                </ol>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 反社会的勢力の定義</h2>
                <p className="text-gray-700 mb-4">
                  当社が定義する「反社会的勢力」とは、以下のような個人または団体を指します。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>暴力団（暴力団員による不当な行為の防止等に関する法律第2条第2号に規定する暴力団）</li>
                  <li>暴力団員（同法第2条第6号に規定する暴力団員）</li>
                  <li>暴力団準構成員</li>
                  <li>暴力団関係企業</li>
                  <li>総会屋、社会運動標ぼうゴロ、政治活動標ぼうゴロ</li>
                  <li>特殊知能暴力集団</li>
                  <li>その他前各号に準ずる者</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 反社会的勢力排除のための取り組み</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（1）組織的な対応体制の整備</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>反社会的勢力対応を統括する部署および責任者を設置</li>
                      <li>コンプライアンス委員会における定期的な検討</li>
                      <li>全従業員への教育・研修の実施</li>
                      <li>対応マニュアルの整備と周知徹底</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（2）外部専門機関との連携</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>警察、暴力追放運動推進センター、弁護士等との連携体制の構築</li>
                      <li>情報の収集・管理体制の整備</li>
                      <li>有事における迅速な相談・通報体制の確立</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（3）取引先の審査体制</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>新規取引開始時における反社チェックの実施</li>
                      <li>既存取引先の定期的な確認</li>
                      <li>契約書への反社会的勢力排除条項の導入</li>
                      <li>疑わしい取引の監視と報告体制の整備</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">（4）プラットフォーム利用者の審査</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>アカウント登録時の本人確認の徹底</li>
                      <li>反社会的勢力に該当する疑いのあるユーザーの審査</li>
                      <li>不審な取引パターンの監視システムの構築</li>
                      <li>通報・報告制度の整備</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 反社会的勢力との関係遮断</h2>
                <p className="text-gray-700 mb-4">
                  当社は、反社会的勢力との関係について、以下の対応を実施いたします。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">取引の禁止</h3>
                    <p className="text-gray-700">
                      反社会的勢力との商取引、業務提携、資本関係など、あらゆる取引を行いません。
                      また、既存の取引先が反社会的勢力であることが判明した場合は、直ちに取引を解消いたします。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">プラットフォーム利用の禁止</h3>
                    <p className="text-gray-700">
                      反社会的勢力によるAPPEXITの利用を一切認めません。
                      利用者が反社会的勢力であることが判明した場合は、直ちにアカウントを停止し、
                      利用規約に基づき契約を解除いたします。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">資金提供の禁止</h3>
                    <p className="text-gray-700">
                      反社会的勢力への資金提供、政治献金、寄付、協賛金その他名目の如何を問わず、
                      いかなる形であっても利益供与を行いません。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">不当要求の拒絶</h3>
                    <p className="text-gray-700">
                      反社会的勢力からの不当要求に対しては、担当者個人の判断で対応せず、
                      組織として毅然とした態度で対応し、一切の要求を拒絶いたします。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 契約書への反社条項の導入</h2>
                <p className="text-gray-700 mb-4">
                  当社は、契約書に以下の内容を含む反社会的勢力排除条項を導入しております。
                </p>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">表明保証条項</h4>
                    <p className="text-gray-700 text-sm">
                      契約当事者が、自己および自己の役員が反社会的勢力ではないこと、
                      また反社会的勢力と関係を有していないことを表明し保証する条項
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">契約解除条項</h4>
                    <p className="text-gray-700 text-sm">
                      契約当事者が反社会的勢力であることが判明した場合、または反社会的勢力と関係を有することが判明した場合に、
                      相手方が催告なしに契約を解除できる条項
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">損害賠償条項</h4>
                    <p className="text-gray-700 text-sm">
                      契約解除により相手方に損害が生じた場合、当該損害を賠償する責任を負う条項
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 不当要求への対応</h2>
                <p className="text-gray-700 mb-4">
                  反社会的勢力から不当な要求を受けた場合、以下の対応を実施いたします。
                </p>
                <ol className="list-decimal list-inside space-y-3 text-gray-700 ml-4">
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

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 疑わしい取引の監視</h2>
                <p className="text-gray-700 mb-4">
                  APPEXITプラットフォーム上での以下のような疑わしい取引を監視し、
                  反社会的勢力による利用を防止いたします。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>異常に高額または低額な取引</li>
                  <li>実態の不明確なアプリ・サービスの売買</li>
                  <li>短期間での頻繁な取引</li>
                  <li>複数アカウントを使用した疑わしい行為</li>
                  <li>マネーロンダリングの疑いがある取引</li>
                  <li>その他、不自然または不審な取引パターン</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 従業員への教育</h2>
                <p className="text-gray-700 mb-4">
                  当社は、全従業員に対して以下の教育・研修を実施しております。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>反社会的勢力に関する基礎知識</li>
                  <li>反社会的勢力の見分け方と対応方法</li>
                  <li>不当要求を受けた場合の初動対応</li>
                  <li>社内報告・連絡体制の周知</li>
                  <li>実際の事例に基づいた対応訓練</li>
                  <li>関連法令およびコンプライアンスの理解</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 利用者の皆様へのお願い</h2>
                <p className="text-gray-700 mb-4">
                  APPEXITをご利用の皆様には、以下の点についてご協力をお願いいたします。
                </p>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">登録情報の正確性</h4>
                    <p className="text-gray-700">
                      アカウント登録時には、正確な情報をご提供ください。
                      虚偽の情報による登録は、アカウント停止の対象となります。
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">不審な取引の報告</h4>
                    <p className="text-gray-700">
                      反社会的勢力と疑われるユーザーや、不審な取引を発見した場合は、
                      速やかに当社までご報告ください。
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">利用規約の遵守</h4>
                    <p className="text-gray-700">
                      APPEXITの利用規約を遵守し、健全な取引環境の維持にご協力ください。
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. 関連法令の遵守</h2>
                <p className="text-gray-700 mb-3">
                  当社は、以下の法令を遵守し、反社会的勢力との関係を遮断いたします。
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                  <li>暴力団員による不当な行為の防止等に関する法律</li>
                  <li>組織的な犯罪の処罰及び犯罪収益の規制等に関する法律</li>
                  <li>犯罪による収益の移転防止に関する法律</li>
                  <li>刑法（恐喝罪、脅迫罪等）</li>
                  <li>各都道府県の暴力団排除条例</li>
                  <li>金融商品取引法</li>
                  <li>その他関連法令</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. 通報・相談窓口</h2>
                <p className="text-gray-700 mb-4">
                  反社会的勢力に関する情報提供や相談は、以下の窓口までお願いいたします。
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-gray-800 mb-2">社内窓口</h4>
                    <p className="text-gray-700">
                      Queue株式会社 コンプライアンス部
                      <br />
                      メールアドレス：compliance@appexit.co.jp
                      <br />
                      電話番号：03-5324-2678（平日 10:00～18:00）
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h4 className="font-semibold text-gray-800 mb-2">外部窓口</h4>
                    <p className="text-gray-700">
                      警察相談専用電話：#9110
                      <br />
                      公益財団法人暴力追放運動推進センター
                      <br />
                      各都道府県警察本部組織犯罪対策課
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mt-4 text-sm">
                  ※通報者の秘密は厳守いたします。また、通報により不利益な取り扱いを受けることはありません。
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. 本方針の見直し</h2>
                <p className="text-gray-700">
                  当社は、社会情勢の変化や法令の改正等に応じて、本方針を適宜見直してまいります。
                  変更があった場合は、本ウェブサイト上で公表いたします。
                </p>
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

