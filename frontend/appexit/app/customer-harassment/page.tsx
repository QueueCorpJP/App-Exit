export default function CustomerHarassmentPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">カスタマーハラスメントに対する方針</h1>

          <div className="prose max-w-none">
            <p className="mb-8">
              Queue株式会社（以下「当社」といいます。）は、アプリ・Webサービス売買プラットフォーム「APPEXIT」を運営する企業として、
              すべての従業員が安全で健全な環境で働けることを重視しております。
              お客様（売り手・買い手の双方を含みます）からの過度な要求や、社会通念上不相当な言動（カスタマーハラスメント）に対しては、
              毅然とした対応をとることをここに宣言いたします。
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">1. 基本方針</h2>
                <p className="mb-4">
                  当社は、アプリ・Webサービスの売買プラットフォームとして、売り手と買い手の両者が安心して取引できる環境を提供することを目指しています。
                  お客様からのご意見やご要望を真摯に受け止め、サービスの改善に努めてまいります。
                  しかしながら、以下のような行為については、カスタマーハラスメントとして対応を制限、
                  または法的措置を講じる場合があります。
                </p>
                <div className="bg-blue-50 rounded p-4 mt-4">
                  <p className=" font-medium mb-2">当社の姿勢</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>従業員の心身の健康と安全を最優先します</li>
                    <li>お客様（売り手・買い手）と従業員の相互尊重を大切にします</li>
                    <li>社会的に許容される範囲を超える要求には応じません</li>
                    <li>必要に応じて警察や弁護士と連携します</li>
                    <li>健全な取引環境の維持に努めます</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">2. カスタマーハラスメントの定義</h2>
                <p className="mb-4">
                  当社では、以下のような行為をカスタマーハラスメントと定義しています。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）暴力的・威嚇的行為</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>身体的な暴力、暴力の予告</li>
                      <li>大声での威嚇、怒鳴りつける行為</li>
                      <li>物を投げる、叩く等の威圧的行動</li>
                      <li>従業員の身の安全を脅かす言動</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）精神的攻撃</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>人格を否定する発言、侮辱的な言動</li>
                      <li>差別的な発言（性別、人種、国籍、年齢、障害等）</li>
                      <li>執拗な叱責、説教</li>
                      <li>SNSやインターネット上での誹謗中傷</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）過度な要求</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>プラットフォームの利用規約を超える要求</li>
                      <li>当社に責任のない取引トラブルについての補償要求</li>
                      <li>手数料免除や不当な値引きの要求</li>
                      <li>他のユーザーに対する不当な優遇措置の要求</li>
                      <li>特定の売り手・買い手との取引強制や取引妨害の要求</li>
                      <li>従業員個人への金品の要求や賄賂</li>
                      <li>売買成立後の不当な条件変更の要求</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（4）業務妨害</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>長時間にわたる拘束、オンライン通話での居座り</li>
                      <li>執拗な電話、メール、チャットメッセージの送信</li>
                      <li>同じ内容の問い合わせを繰り返す行為</li>
                      <li>正当な理由なく、対応者の変更を繰り返し要求する行為</li>
                      <li>録音・録画・スクリーンショットの強要</li>
                      <li>営業時間外や深夜の連絡を繰り返す行為</li>
                      <li>虚偽の情報や不正な取引の申し込み</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（5）性的な言動</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>性的な発言、わいせつな言動</li>
                      <li>交際や性的関係の要求</li>
                      <li>容姿に関する不適切な発言</li>
                      <li>不必要な身体接触</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（6）権威を利用した言動</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>「SNSで拡散する」「レビューサイトに悪評を書く」などの脅迫</li>
                      <li>「弁護士に相談する」等の威嚇（正当な権利行使を除く）</li>
                      <li>「マスコミに言う」「ニュースにする」等の脅し</li>
                      <li>「消費者センターに訴える」等の不当な圧力</li>
                      <li>「関係省庁に通報する」等の不当な威嚇</li>
                      <li>影響力のある立場を利用した圧力</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">3. 対応方針</h2>
                <p className="mb-4">
                  カスタマーハラスメントと判断した場合、当社は以下の対応を行います。
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">（1）警告と対応の制限</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>不適切な言動に対する警告</li>
                      <li>対応時間や方法の制限（書面のみ、特定時間帯のみ等）</li>
                      <li>対応担当者の固定または変更</li>
                      <li>複数名での対応</li>
                      <li>通話の録音、やり取りの記録</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（2）サービス提供の制限・停止</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>アカウントの一時停止または永久停止</li>
                      <li>今後のサービス利用の拒否</li>
                      <li>出品・購入機能の制限</li>
                      <li>メッセージ機能の制限</li>
                      <li>進行中の取引の中止</li>
                      <li>プラットフォームからの退会処理</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">（3）法的措置</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>警察への通報</li>
                      <li>弁護士を通じた警告</li>
                      <li>民事訴訟の提起（損害賠償請求等）</li>
                      <li>刑事告訴（脅迫罪、侮辱罪、業務妨害罪等）</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">4. 正当なご意見・ご要望について</h2>
                <p className="mb-3">
                  当社は、お客様からの正当なご意見やご要望、ご指摘については真摯に受け止めます。
                  以下のようなご連絡は、カスタマーハラスメントには該当しません。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>プラットフォームの不具合や技術的問題に関する適切な指摘</li>
                  <li>取引条件や利用規約の確認</li>
                  <li>正当な権利に基づく取引トラブルの相談</li>
                  <li>手数料やサービス内容に関する合理的な質問</li>
                  <li>サービス改善のための建設的な提案</li>
                  <li>アプリ・サービスの譲渡に関する正当な問い合わせ</li>
                  <li>売買契約に関する正当な交渉</li>
                  <li>社会通念上妥当な範囲での要望</li>
                </ul>
                <p className=" mt-4">
                  ただし、これらの内容であっても、伝え方や頻度が社会通念上不相当である場合は、
                  カスタマーハラスメントと判断する場合があります。
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">5. 従業員への対応</h2>
                <p className="mb-3">
                  当社は、従業員がカスタマーハラスメントの被害を受けないよう、以下の取り組みを行います。
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">教育・研修</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>カスタマーハラスメントに関する定期的な研修</li>
                      <li>適切な対応方法の習得</li>
                      <li>エスカレーション手順の周知</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">サポート体制</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>相談窓口の設置</li>
                      <li>上司や同僚によるサポート</li>
                      <li>必要に応じた専門家（弁護士、カウンセラー等）への相談</li>
                      <li>被害を受けた従業員のメンタルケア</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">就業環境の整備</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>従業員が一人で対応しない体制づくり</li>
                      <li>記録・証拠の保全</li>
                      <li>安全な対応場所の確保</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">6. お客様へのお願い</h2>
                <p className="mb-3">
                  当社は、すべてのお客様（売り手・買い手）に快適にサービスをご利用いただけるよう努めております。
                  健全な取引環境を維持するため、以下の点にご協力をお願いいたします。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>従業員も一人の人間であることをご理解ください</li>
                  <li>相互の尊重に基づいた建設的なコミュニケーションをお願いします</li>
                  <li>感情的にならず、冷静な対話を心がけてください</li>
                  <li>社会通念上妥当な範囲でのご要望をお願いします</li>
                  <li>プラットフォームの利用規約を遵守してください</li>
                  <li>従業員の説明や判断をご理解ください</li>
                  <li>取引相手（売り手・買い手）に対しても礼儀を持って接してください</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">7. 関連法令</h2>
                <p className="mb-3">
                  カスタマーハラスメントは、以下の法令に抵触する可能性があります。
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>刑法（脅迫罪、強要罪、侮辱罪、名誉毀損罪、業務妨害罪等）</li>
                  <li>暴力団対策法</li>
                  <li>ストーカー規制法</li>
                  <li>軽犯罪法</li>
                  <li>民法（不法行為）</li>
                  <li>労働施策総合推進法（パワーハラスメント防止措置）</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">8. 相談窓口</h2>
                <p className="mb-4">
                  カスタマーハラスメントに関するご相談やお問い合わせは、以下の窓口までお願いいたします。
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">お客様向け相談窓口</h3>
                    <p className="">
                      Queue株式会社 カスタマーサポート
                      <br />
                      メールアドレス：support@appexit.jp
                      <br />
                      電話番号：03-5324-2678
                      <br />
                      受付時間：平日 10:00～18:00（土日祝日除く）
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">従業員向け内部相談窓口</h3>
                    <p className="">
                      人事部 ハラスメント相談窓口
                      <br />
                      メールアドレス：harassment@appexit.jp
                      <br />
                      ※従業員専用の窓口です
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">9. 本方針の見直し</h2>
                <p className="">
                  当社は、社会情勢の変化や法令の改正等に応じて、本方針を適宜見直してまいります。
                  変更があった場合は、本ウェブサイト上で公表いたします。
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">最後に</h2>
                <p className="">
                  当社は、アプリ・Webサービスの売買プラットフォームとして、お客様（売り手・買い手）と従業員の相互尊重に基づいた
                  健全な取引環境を築くことを目指しています。
                  お客様からのご意見やご要望は、サービス向上の貴重な機会として真摯に受け止めますが、
                  従業員の人権と尊厳を守ること、そしてすべての利用者が安心して取引できる環境を提供することも
                  当社の重要な責務であると考えております。
                  何卒ご理解とご協力をお願い申し上げます。
                </p>
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

