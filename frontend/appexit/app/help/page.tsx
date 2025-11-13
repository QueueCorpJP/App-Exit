import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold mb-6 text-center" style={{ color: '#323232' }}>ヘルプセンター</h1>
          <p className="text-lg" style={{ color: '#323232' }}>
            APPEXITのご利用にあたって、困ったときはこちらをご確認ください
          </p>
        </div>

        <div className="space-y-20">
          {/* はじめての方へ */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>はじめての方へ</h2>
              <p className="text-sm" style={{ color: '#323232' }}>APPEXITの基本的な使い方やサービス内容をご確認いただけます</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/about" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>APPEXITについて</h3>
                <p className="text-sm" style={{ color: '#323232' }}>サービスの概要や特徴をご紹介します</p>
              </Link>
              <Link href="/faq" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>よくある質問（FAQ）</h3>
                <p className="text-sm" style={{ color: '#323232' }}>多くのお客様から寄せられる質問と回答</p>
              </Link>
              <Link href="/support-service" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>サポートサービス</h3>
                <p className="text-sm" style={{ color: '#323232' }}>専門スタッフによるサポート内容のご案内</p>
              </Link>
            </div>
          </section>

          {/* お困りのとき */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>お困りのとき</h2>
              <p className="text-sm" style={{ color: '#323232' }}>トラブルや疑問がある場合は、こちらからお問い合わせください</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/contact" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>お問い合わせ</h3>
                <p className="text-sm" style={{ color: '#323232' }}>サービスに関するご質問やご相談はこちら</p>
              </Link>
              <Link href="/report" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>違反報告</h3>
                <p className="text-sm" style={{ color: '#323232' }}>規約違反や不審な行為を発見した場合</p>
              </Link>
              <Link href="/seminar" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>説明会・相談会</h3>
                <p className="text-sm" style={{ color: '#323232' }}>専門スタッフが直接サポートいたします</p>
              </Link>
            </div>
          </section>

          {/* 利用規約・ポリシー */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>利用規約・ポリシー</h2>
              <p className="text-sm" style={{ color: '#323232' }}>安心してご利用いただくための各種規約とポリシーをご確認ください</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/terms" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>利用規約</h3>
                <p className="text-sm" style={{ color: '#323232' }}>サービス利用時の基本的なルール</p>
              </Link>
              <Link href="/privacy" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>プライバシーポリシー</h3>
                <p className="text-sm" style={{ color: '#323232' }}>個人情報の取り扱いについて</p>
              </Link>
              <Link href="/cookie-policy" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>クッキーポリシー</h3>
                <p className="text-sm" style={{ color: '#323232' }}>Cookieの使用に関する方針</p>
              </Link>
              <Link href="/tokusho" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>特定商取引法に基づく表記</h3>
                <p className="text-sm" style={{ color: '#323232' }}>事業者情報と取引条件</p>
              </Link>
            </div>
          </section>

          {/* セキュリティ・安全管理 */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>セキュリティ・安全管理</h2>
              <p className="text-sm" style={{ color: '#323232' }}>お客様の安全を守るための取り組みをご紹介します</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/security" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>情報セキュリティ基本方針</h3>
                <p className="text-sm" style={{ color: '#323232' }}>情報資産の保護に関する方針</p>
              </Link>
              <Link href="/safety" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>安全管理方針</h3>
                <p className="text-sm" style={{ color: '#323232' }}>利用者の安全確保に関する方針</p>
              </Link>
              <Link href="/compliance" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>反社会的勢力に対する基本方針</h3>
                <p className="text-sm" style={{ color: '#323232' }}>反社会的勢力の排除について</p>
              </Link>
              <Link href="/customer-harassment" className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <h3 className="font-bold mb-3" style={{ color: '#323232' }}>カスタマーハラスメントに対する考え方</h3>
                <p className="text-sm" style={{ color: '#323232' }}>健全なコミュニケーションのために</p>
              </Link>
            </div>
          </section>

          {/* 緊急時の連絡先 */}
          <section className="border-t border-gray-200 pt-12">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-6" style={{ color: '#323232' }}>緊急時の連絡先</h2>
              <div className="space-y-3">
                <p style={{ color: '#323232' }}>
                  <span className="font-semibold">カスタマーサポート：</span>
                  <a href="mailto:support@appexit.jp" className="hover:underline ml-2">support@appexit.jp</a>
                </p>
                <p style={{ color: '#323232' }}>
                  <span className="font-semibold">セキュリティ関連：</span>
                  <a href="mailto:security@appexit.jp" className="hover:underline ml-2">security@appexit.jp</a>
                </p>
                <p style={{ color: '#323232' }}>
                  <span className="font-semibold">安全管理関連：</span>
                  <a href="mailto:safety@appexit.jp" className="hover:underline ml-2">safety@appexit.jp</a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}


