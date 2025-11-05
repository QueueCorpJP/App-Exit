'use client';

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
          q: 'APPEXITとFlippaの違いは何ですか？',
          a: 'APPEXITは日本市場に特化し、日本語で全てサポートします。専任担当制で手厚いサポートを提供し、月商数万円の小規模案件も歓迎します。Flippaは英語のみで、セルフサービスが基本です。'
        },
        {
          q: 'APPEXITとAcquire.comの違いは何ですか？',
          a: 'APPEXITは月商数万円から取り扱い、個人開発者を積極的に歓迎します。Acquire.comは月商10万ドル以上の大型案件が中心で、審査も厳格です。日本の個人開発者にはAPPEXITが最適です。'
        },
        {
          q: 'なぜAPPEXITを選ぶべきですか？',
          a: '①日本市場に特化、②専任担当による手厚いサポート、③AI価格査定、④個人開発者・小規模案件歓迎、⑤安心の取引（エスクロー・契約書作成）、⑥高い成約率。日本でアプリ・Webサービスを売買するなら、APPEXIT一択です。'
        },
        {
          q: 'どんなアプリ・サービスが売れますか？',
          a: 'iOS/Androidアプリ、SaaS、Webアプリ、ECサイト、メディアサイト、コミュニティサイトなど、あらゆるアプリ・Webサービスが売買可能です。技術スタックも問いません。'
        },
        {
          q: 'AI価格査定とは何ですか？',
          a: '売上、ユーザー数、成長率、技術スタック、業界相場などのデータを機械学習で分析し、適正価格を自動算出するサービスです。無料でご利用いただけます。'
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              よくある質問（FAQ）
            </h1>
            <p className="text-xl text-gray-600">
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

          {/* CTA */}
          <div className="mt-12 text-center bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              まだ疑問が解決しませんか？
            </h2>
            <p className="mb-6">
              無料相談で専門スタッフが丁寧にお答えします
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/seminar"
                className="bg-white text-[#FF6B35] px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                説明会に参加する（無料）
              </a>
              <a
                href="/contact"
                className="bg-white text-[#FF6B35] px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                個別相談を申し込む（無料）
              </a>
            </div>
          </div>

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

