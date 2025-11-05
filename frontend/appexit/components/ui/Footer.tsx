'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      {/* メインフッターコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* カテゴリ */}
          <div>
            <h3 className="text-lg font-semibold mb-6">カテゴリ</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/category/technology" className="text-gray-300 hover:text-white transition-colors text-sm">
                  テクノロジー・ガジェット
                </Link>
              </li>
              <li>
                <Link href="/category/product" className="text-gray-300 hover:text-white transition-colors text-sm">
                  プロダクト
                </Link>
              </li>
              <li>
                <Link href="/category/food" className="text-gray-300 hover:text-white transition-colors text-sm">
                  フード・飲食店
                </Link>
              </li>
              <li>
                <Link href="/category/anime" className="text-gray-300 hover:text-white transition-colors text-sm">
                  アニメ・漫画
                </Link>
              </li>
              <li>
                <Link href="/category/fashion" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ファッション
                </Link>
              </li>
              <li>
                <Link href="/category/game" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ゲーム・サービス開発
                </Link>
              </li>
              <li>
                <Link href="/category/business" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ビジネス・起業
                </Link>
              </li>
              <li>
                <Link href="/category/art" className="text-gray-300 hover:text-white transition-colors text-sm">
                  アート・写真
                </Link>
              </li>
              <li>
                <Link href="/category/social" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ソーシャルグッド
                </Link>
              </li>
            </ul>
          </div>

          {/* 起業サポート */}
          <div>
            <h3 className="text-lg font-semibold mb-6">起業サポート</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support/project" className="text-gray-300 hover:text-white transition-colors text-sm">
                  プロジェクトを作る
                </Link>
              </li>
              <li>
                <Link href="/support/materials" className="text-gray-300 hover:text-white transition-colors text-sm">
                  資料請求
                </Link>
              </li>
              <li>
                <Link href="/academy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  🎓 APPEXITアカデミー
                </Link>
              </li>
              <li className="mt-4">
                <div className="text-sm text-gray-400 mb-2">APPEXITアカデミーとは</div>
                <Link href="/academy/marketplace" className="text-gray-300 hover:text-white transition-colors text-sm block mb-2">
                  アプリ売買とは
                </Link>
                <Link href="/academy/how-to-sell" className="text-gray-300 hover:text-white transition-colors text-sm block mb-2">
                  アプリを売る方法
                </Link>
                <Link href="/academy/how-to-buy" className="text-gray-300 hover:text-white transition-colors text-sm block">
                  アプリを買う方法
                </Link>
              </li>
            </ul>
            
            {/* 右側のカラム */}
            <div className="mt-8">
              <ul className="space-y-3">
                <li>
                  <Link href="/lifestyle" className="text-gray-300 hover:text-white transition-colors text-sm">
                    まちづくり・地域活性化
                  </Link>
                </li>
                <li>
                  <Link href="/music" className="text-gray-300 hover:text-white transition-colors text-sm">
                    音楽
                  </Link>
                </li>
                <li>
                  <Link href="/challenge" className="text-gray-300 hover:text-white transition-colors text-sm">
                    チャレンジ
                  </Link>
                </li>
                <li>
                  <Link href="/sports" className="text-gray-300 hover:text-white transition-colors text-sm">
                    スポーツ
                  </Link>
                </li>
                <li>
                  <Link href="/movie" className="text-gray-300 hover:text-white transition-colors text-sm">
                    映像・映画
                  </Link>
                </li>
                <li>
                  <Link href="/book" className="text-gray-300 hover:text-white transition-colors text-sm">
                    書籍・雑誌出版
                  </Link>
                </li>
                <li>
                  <Link href="/beauty" className="text-gray-300 hover:text-white transition-colors text-sm">
                    ビューティー・ヘルスケア
                  </Link>
                </li>
                <li>
                  <Link href="/dance" className="text-gray-300 hover:text-white transition-colors text-sm">
                    舞台・パフォーマンス
                  </Link>
                </li>
              </ul>

              <div className="mt-8">
                <div className="text-sm text-gray-400 mb-2">アプリ・サービス売買のノウハウを無料で学ぼう</div>
                <div className="flex items-center space-x-4 mt-4">
                  <Link href="/seminar" className="text-gray-300 hover:text-white transition-colors text-sm">
                    説明会・相談会
                  </Link>
                  <Link href="/support-service" className="text-gray-300 hover:text-white transition-colors text-sm">
                    サポートサービス
                  </Link>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <Link href="/case-studies" className="text-gray-300 hover:text-white transition-colors text-sm">
                    取引事例
                  </Link>
                  <Link href="/data" className="text-gray-300 hover:text-white transition-colors text-sm">
                    統計データ
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h3 className="text-lg font-semibold mb-6">サービス</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/appexit" className="text-gray-300 hover:text-white transition-colors text-sm">
                  APPEXIT
                </Link>
              </li>
            </ul>
          </div>

          {/* APPEXITについて */}
          <div>
            <h3 className="text-lg font-semibold mb-6">APPEXITについて</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  APPEXITとは
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-gray-300 hover:text-white transition-colors text-sm">
                  あんしん・安全への取り組み
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors text-sm">
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-gray-300 hover:text-white transition-colors text-sm">
                  各種設定
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-gray-300 hover:text-white transition-colors text-sm">
                  報告
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/tokusho" className="text-gray-300 hover:text-white transition-colors text-sm">
                  特定商取引法に基づく表記
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-gray-300 hover:text-white transition-colors text-sm">
                  情報セキュリティ方針
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-gray-300 hover:text-white transition-colors text-sm">
                  反社基本方針
                </Link>
              </li>
              <li>
                <Link href="/customer-harassment" className="text-gray-300 hover:text-white transition-colors text-sm">
                  カスタマーハラスメントに対する考え方
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  クッキーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ボトムセクション */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            {/* 左側：会社情報 */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-6 mb-4 lg:mb-0">
              <div className="flex items-center space-x-2">
                <img src="/icon.png" alt="APPEXIT" className="h-8 w-auto" />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-300">
                <span>APPEXIT GROUP</span>
                <span>Queue株式会社</span>
              </div>
            </div>

            {/* 中央：コピーライト */}
            <div className="text-center mb-4 lg:mb-0">
              <p className="text-xs text-gray-400">
                「QRコード」は株式会社デンソーウェーブの登録商標です。
              </p>
            </div>

            {/* 右側：リンクとソーシャル */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm text-gray-300">
                <Link href="/company" className="hover:text-white transition-colors">
                  ©APPEXIT, Inc.
                </Link>
                <Link href="/company" className="hover:text-white transition-colors">
                  会社概要
                </Link>
                <Link href="/recruit" className="hover:text-white transition-colors">
                  採用情報
                </Link>
                <Link href="/partner" className="hover:text-white transition-colors">
                  パートナー募集
                </Link>
              </div>
              
              {/* ソーシャルアイコン */}
              <div className="flex items-center space-x-3">
                <Link href="mailto:contact@appexit.co.jp" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </Link>
                <Link href="https://www.facebook.com/appexitjp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Link>
                <Link href="https://twitter.com/appexitjp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Link>
                <Link href="https://www.instagram.com/appexitjp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323C5.902 8.248 7.053 7.758 8.35 7.758s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387zm7.718 0c-1.297 0-2.448-.49-3.323-1.297-.897-.875-1.387-2.026-1.387-3.323s.49-2.448 1.297-3.323c.875-.897 2.026-1.387 3.323-1.387s2.448.49 3.323 1.297c.897.875 1.387 2.026 1.387 3.323s-.49 2.448-1.297 3.323c-.875.897-2.026 1.387-3.323 1.387z"/>
                  </svg>
                </Link>
                <Link href="https://www.youtube.com/appexitjp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
