export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-12 text-center">APPEXITについて</h1>
          <p className="text-gray-700 mb-10">
            APPEXITは、個人や小規模チームが開発したアプリ・Webサービスを、次の運営者へとつなぐ
            日本最大級の売買プラットフォームです。適正な価格での取引、専任担当による伴走支援、
            そして充実したセキュリティ対策により、安心・安全なM&Aを実現します。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">ミッション</h2>
              <p className="text-gray-700">
                価値あるプロダクトに、次のチャンスと持続可能な運営者を。
                ものづくりの成果が正当に評価される市場をつくります。
              </p>
            </div>
            <div className="border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">提供価値</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>適正価格の査定とマッチング</li>
                <li>専任担当による伴走サポート</li>
                <li>安全な決済・秘密保持・審査の仕組み</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 p-6 mb-10 bg-blue-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">あんしん・安全への取り組み</h2>
            <p className="text-gray-700 mb-3">
              APPEXITは、情報セキュリティ基本方針、反社会的勢力排除方針、プライバシーポリシー、クッキーポリシー等に基づき、継続的に安全性を高めています。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/security" className="text-blue-600 hover:text-blue-800 underline">
                情報セキュリティ基本方針
              </a>
              <a href="/compliance" className="text-blue-600 hover:text-blue-800 underline">
                反社会的勢力に対する基本方針
              </a>
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                プライバシーポリシー
              </a>
              <a href="/cookie-policy" className="text-blue-600 hover:text-blue-800 underline">
                クッキーポリシー
              </a>
            </div>
          </div>

          <div className="border border-gray-200 p-6 mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">APPEXITとは</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                APPEXITは、出品者（売り手）と購入者（買い手）が、アプリやWebサービスを安全に取引できる
                マーケットプレイスです。運営実績やユーザーデータ、収益性などの情報を踏まえ、適切な引継ぎと
                スムーズな運用開始を支援します。
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>公開・非公開の両方での売却検討が可能</li>
                <li>NDA（秘密保持）および本人確認に基づく安全な情報開示</li>
                <li>決済・譲渡・引継ぎの実務を専任担当がサポート</li>
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">関連リンク</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a href="/faq" className="text-blue-600 hover:text-blue-800 underline">
                よくある質問（FAQ）
              </a>
              <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                お問い合わせ
              </a>
              <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                利用規約
              </a>
              <a href="/tokusho" className="text-blue-600 hover:text-blue-800 underline">
                特定商取引法に基づく表記
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


