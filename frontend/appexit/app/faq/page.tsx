export default function FAQPage() {
  const faqs = [
    {
      category: '売却について',
      items: [
        {
          q: 'アプリやWebサービスを売却するのは初めてですが、大丈夫ですか？',
          a: 'はい、APPEXITでは専任担当が売却の全プロセスをサポートします。価格査定から出品資料の作成、買い手とのマッチング、契約、引き継ぎまで一貫してサポートしますので、初めての方でも安心してご利用いただけます。'
        },
        {
          q: '月商が少なくても売却できますか？',
          a: 'はい、月商1万円以上から売却可能です。APPEXITは個人開発者の小規模案件を積極的に取り扱っています。現在の売上が少なくても、成長性や将来性があれば問題ありません。'
        },
        {
          q: '売却価格の相場はどのくらいですか？',
          a: '一般的に、SaaSは月商の12〜24ヶ月分、アプリは6〜12ヶ月分、ECサイトは3〜6ヶ月分、メディアは6〜18ヶ月分が相場です。無料のAI価格査定で正確な価格をご提示します。'
        },
        {
          q: '売却にどのくらいの期間がかかりますか？',
          a: '平均2〜6ヶ月です。出品登録・審査に1週間、買い手探しに1〜3ヶ月、交渉・デューデリジェンスに2週間〜1ヶ月、契約・引き継ぎに2週間〜1ヶ月が目安です。早ければ1ヶ月で成約する例もあります。'
        },
        {
          q: '非公開で売却したいのですが可能ですか？',
          a: 'はい、非公開案件として取り扱い可能です。競合や関係者に知られずに売却活動を進めることができます。'
        },
        {
          q: 'ソースコードを公開する必要がありますか？',
          a: 'いいえ、一般公開はしません。デューデリジェンス段階でNDA（秘密保持契約）を締結した後に、買い手候補のみに開示します。'
        },
        {
          q: '手数料はいくらですか？',
          a: '売り手は成約時に取引金額の10%です。出品や査定、相談は完全無料で、成約するまで一切費用はかかりません。'
        },
        {
          q: '個人でも法人でも利用できますか？',
          a: 'はい、個人・法人問わずご利用いただけます。APPEXITは特に個人開発者を歓迎しています。'
        }
      ]
    },
    {
      category: '購入について',
      items: [
        {
          q: 'アプリやWebサービスを買うのは初めてですが、大丈夫ですか？',
          a: 'はい、専任担当が購入プロセスをサポートします。案件選定、デューデリジェンス（詳細調査）、価格交渉、契約、引き継ぎまで一貫してサポートしますので、初めての方でも安心です。'
        },
        {
          q: '購入後すぐに運営できますか？',
          a: 'はい、引き継ぎサポート付きですぐに運営開始できます。技術移管、ドメイン移管、データ移行、運用マニュアルの提供など、スムーズな引き継ぎをサポートします。'
        },
        {
          q: '失敗しないか不安です',
          a: 'デューデリジェンス（DD）で売上の真偽、ユーザー数、技術的負債、法的リスクを詳細に確認します。専門家による調査も手配可能です。また、契約書には表明保証条項を盛り込み、リスクを最小化します。'
        },
        {
          q: 'どんな人が買っていますか？',
          a: '個人投資家（副業として運営）、企業（既存事業とのシナジー）、開発者（技術習得・ポートフォリオ拡大）、投資ファンド（投資案件として）など、様々な方がご利用されています。'
        },
        {
          q: '小規模な案件も購入できますか？',
          a: 'はい、月商数万円の小規模案件も豊富に取り扱っています。初めてのアプリ購入には、小規模案件から始めることをお勧めします。'
        },
        {
          q: '手数料はいくらですか？',
          a: '買い手は成約時に取引金額の5%です。案件閲覧や相談は完全無料です。'
        }
      ]
    },
    {
      category: 'APPEXITについて',
      items: [
        {
          q: 'APPEXITの最大の強みは何ですか？',
          a: '**AI技術による圧倒的な差別化**です。FlippaやAcquire.comにはないAI価格査定（精度90%以上）、AIマッチング（成功率3倍）、AI審査（不正検出95%以上）、AI市場分析を実装しています。これにより、より正確な価格設定、最適な買い手とのマッチング、安全な取引を実現しています。'
        },
        {
          q: 'APPEXITとFlippaの違いは何ですか？',
          a: '最大の違いは**AI技術の有無**です。APPEXITはAI価格査定・AIマッチング・AI審査を実装していますが、Flippaにはありません。また、APPEXITは日本市場に特化し日本語で全てサポート、専任担当制で手厚いサポート、月商数万円の小規模案件も歓迎します。Flippaは英語のみで、セルフサービスが基本です。'
        },
        {
          q: 'APPEXITとAcquire.comの違いは何ですか？',
          a: '最大の違いは**AI技術**です。APPEXITはAI査定・マッチング・審査を実装していますが、Acquire.comは人力のみです。また、APPEXITは月商数万円から取り扱い、個人開発者を積極的に歓迎、AI+人力の柔軟な審査を行います。Acquire.comは月商10万ドル以上の大型案件が中心で、人力審査も厳格です。日本の個人開発者にはAPPEXITが最適です。'
        },
        {
          q: 'なぜAPPEXITを選ぶべきですか？',
          a: '①**AI技術による圧倒的差別化**（FlippaやAcquire.comにはなし）、②日本市場に特化（グローバル展開準備中）、③専任担当による手厚いサポート、④AI価格査定（精度90%以上）、⑤AIマッチング（成功率3倍）、⑥AI審査（不正検出95%以上）、⑦個人開発者・小規模案件歓迎、⑧安心の取引（エスクロー・契約書作成）、⑨高い成約率。日本でアプリ・Webサービスを売買するなら、APPEXIT一択です。'
        },
        {
          q: 'どんなアプリ・サービスが売れますか？',
          a: 'iOS/Androidアプリ、SaaS、Webアプリ、ECサイト、メディアサイト、コミュニティサイトなど、あらゆるアプリ・Webサービスが売買可能です。技術スタックも問いません。'
        },
        {
          q: 'AI価格査定とは何ですか？',
          a: '**APPEXITの最大の強み**の一つです。機械学習により、売上、ユーザー数、成長率、技術スタック、業界相場、市場トレンドなどを総合的に分析し、適正価格を自動算出します。**精度90%以上**を実現しており、人間の査定では見落としがちな成長性も正確に評価します。完全無料でご利用いただけます。FlippaやAcquire.comにはないAPPEXIT独自の技術です。'
        },
        {
          q: 'AIマッチングとはどのような仕組みですか？',
          a: '買い手の購入希望条件（予算、業種、技術スタック、成長率等）と、売り手の案件を自動照合し、シナジー効果が高い組み合わせを提案するシステムです。例えば、「ECサイト運営経験がある買い手」には「成長中のECサイト」を優先的にマッチング。これにより、**マッチング成功率が従来の3倍**に向上しています。FlippaやAcquire.comにはない技術です。'
        },
        {
          q: 'AI審査で不正案件を防げますか？',
          a: 'はい、**不正案件検出率95%以上**を実現しています。AI審査では、売上の信憑性（不自然な急増・急減）、ユーザー数の妥当性（ボット・偽アカウント）、技術的負債（古いライブラリ、セキュリティ脆弱性）、知的財産権の問題、過去の不正取引歴などを自動検出します。これにより、安心・安全な取引を実現しています。'
        },
        {
          q: 'グローバル展開の予定はありますか？',
          a: 'はい、現在準備中です。AI翻訳技術により、日本のアプリを海外市場へ、海外のアプリを日本市場へ流通させる計画です。まずは英語圏から開始し、順次多言語対応を進めます。グローバルM&Aプラットフォームとして進化していきます。'
        },
        {
          q: '安全性は確保されていますか？',
          a: 'はい。SSL/TLS暗号化通信、個人情報の厳重管理、エスクローサービス、契約書の専門家レビュー、デューデリジェンス支援など、多層的なセキュリティ対策を実施しています。'
        }
      ]
    },
    {
      category: '手続き・サポート',
      items: [
        {
          q: '無料相談はありますか？',
          a: 'はい、オンライン説明会（無料・予約制）と個別相談会（無料・秘密厳守）を実施しています。NDA締結も可能です。'
        },
        {
          q: 'エスクローサービスとは何ですか？',
          a: '売り手と買い手の間に第三者（APPEXIT）が入り、代金と引き換えに資産を引き渡す仕組みです。決済リスクを最小化し、安全な取引を実現します。'
        },
        {
          q: '契約書は自分で作る必要がありますか？',
          a: 'いいえ、APPEXITが契約書テンプレートを提供し、必要に応じて専門家（弁護士）のレビューも手配します。'
        },
        {
          q: 'デューデリジェンス（DD）とは何ですか？',
          a: '買収前に行う詳細調査のことです。売上の真偽、ユーザー数の確認、技術的負債のチェック、法的リスクの確認などを行います。APPEXITがサポートします。'
        },
        {
          q: '引き継ぎはどのように行われますか？',
          a: '専任担当が引き継ぎをサポートします。技術移管（ソースコード、サーバー、ドメイン）、データ移行、運用マニュアルの提供、一定期間のサポートなどを含みます。'
        }
      ]
    }
  ];

  // 構造化データ
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(category => 
      category.items.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    )
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      
      <div className="min-h-screen bg-[#F9F8F7] py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-2xl font-bold mb-12 text-center" style={{ color: '#323232' }}>
              よくある質問（FAQ）
            </h1>
            <p className="text-lg" style={{ color: '#323232' }}>
              アプリ・Webサービス売買に関するよくある質問
            </p>
          </div>

          {/* FAQ一覧 */}
          {faqs.map((category, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-[#FF6B35]">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start">
                      <span className="bg-[#FF6B35] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0 mt-0.5">
                        Q
                      </span>
                      {item.q}
                    </h3>
                    <div className="ml-9 text-gray-700 leading-relaxed">
                      <span className="font-semibold text-[#FF6B35] mr-2">A:</span>
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 関連リンク */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/support-service"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">サポートサービス</h3>
              <p className="text-sm text-gray-600">充実のサポート内容をご確認ください</p>
            </a>
            <a
              href="/terms"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">利用規約</h3>
              <p className="text-sm text-gray-600">サービスの利用規約をご確認ください</p>
            </a>
            <a
              href="/privacy"
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-bold text-gray-900 mb-2">プライバシーポリシー</h3>
              <p className="text-sm text-gray-600">個人情報の取り扱いをご確認ください</p>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

