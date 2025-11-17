import Link from 'next/link'
import { supportServiceData, howToSellApp, howToBuyApp } from './metadata'
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function SupportServicePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const supportDict = await loadPageDictionary(locale, 'support');
  const tp = (key: string): string => {
    const keys = key.split('.');
    let value: any = supportDict;
    for (const k of keys) { value = value?.[k]; }
    return value || key;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportServiceData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSellApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToBuyApp) }}
      />
      {locale === 'ja' ? (
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">サポートサービス</h1>
          <p className="text-xl text-gray-600">
            アプリ・Webサービスの売買を成功に導く、充実のサポート体制
          </p>
        </div>

        {/* サポートの特徴 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">専任担当制</h3>
            <p className="text-gray-600 text-sm">
              経験豊富な専任スタッフが、出品から成約まで一貫してサポートします
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">安心・安全</h3>
            <p className="text-gray-600 text-sm">
              契約書作成、デューデリジェンス、エスクローまで安全な取引をサポート
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">スピーディー</h3>
            <p className="text-gray-600 text-sm">
              迅速なマッチングと円滑な取引進行で、最短での成約を実現します
            </p>
          </div>
        </div>

        {/* サービス一覧 */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">提供サービス</h2>

          <div className="space-y-8">
            {/* 売り手向けサポート */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">売り手向けサポート</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">1</span>
                    価格査定・相場アドバイス
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    過去の取引データや市場動向を基に、適正な売却価格をアドバイス。高値での売却をサポートします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 類似案件の成約価格分析</li>
                    <li>• 売却価格のシミュレーション</li>
                    <li>• 価格設定の戦略立案</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">2</span>
                    出品資料の作成サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    魅力的な出品ページの作成をサポート。買い手の興味を引くポイントを専門家がアドバイスします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 訴求ポイントの整理</li>
                    <li>• 資料テンプレートの提供</li>
                    <li>• 添削・フィードバック</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">3</span>
                    買い手とのマッチング
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    条件に合う買い手候補を積極的にご紹介。スムーズなマッチングを実現します。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 買い手データベースの活用</li>
                    <li>• 条件マッチング</li>
                    <li>• 交渉の橋渡し</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">4</span>
                    デューデリジェンス対応
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    買い手からの質問対応や資料準備をサポート。安心して取引を進められます。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 必要書類のリスト化</li>
                    <li>• 質問への回答サポート</li>
                    <li>• 情報開示の範囲アドバイス</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">5</span>
                    契約書作成・交渉サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    契約条件の交渉から契約書作成まで、専門家がサポートします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 契約書テンプレート提供</li>
                    <li>• 条件交渉のアドバイス</li>
                    <li>• 弁護士紹介（オプション）</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">6</span>
                    引き継ぎサポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    成約後のスムーズな引き継ぎをサポート。トラブルを未然に防ぎます。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 引き継ぎチェックリスト</li>
                    <li>• 技術移管のサポート</li>
                    <li>• アフターフォロー</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 買い手向けサポート */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">買い手向けサポート</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">1</span>
                    案件紹介・マッチング
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    ご希望に合う案件を積極的にご紹介。非公開案件の情報も優先的にお届けします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 条件ヒアリング</li>
                    <li>• 非公開案件の紹介</li>
                    <li>• 新着案件の優先通知</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">2</span>
                    案件分析・評価サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    気になる案件の分析・評価をサポート。購入判断に必要な情報を提供します。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 収益性の分析</li>
                    <li>• 成長可能性の評価</li>
                    <li>• リスク要因の洗い出し</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">3</span>
                    デューデリジェンス支援
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    技術面・ビジネス面の詳細調査をサポート。専門家による確認も手配可能です。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 確認項目のチェックリスト</li>
                    <li>• 技術DD（技術監査）サポート</li>
                    <li>• 専門家の紹介</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">4</span>
                    価格交渉サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    適正価格での購入を実現。交渉のポイントをアドバイスします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 相場情報の提供</li>
                    <li>• 交渉戦略の立案</li>
                    <li>• 条件調整の仲介</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">5</span>
                    契約・決済サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    契約書の確認から決済まで、安全な取引をサポートします。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 契約書のレビュー</li>
                    <li>• エスクローサービス</li>
                    <li>• 決済方法のアドバイス</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">6</span>
                    引き継ぎ・運用サポート
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    購入後の引き継ぎから運用開始までをサポート。必要に応じて運用代行も可能です。
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• 引き継ぎスケジュール管理</li>
                    <li>• 技術サポート</li>
                    <li>• 運用代行サービス（オプション）</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* オプションサービス */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">オプションサービス</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">弁護士紹介</h3>
              <p className="text-gray-700 text-sm mb-4">
                M&Aに詳しい弁護士をご紹介。契約書作成やリーガルチェックをサポートします。
              </p>
              <p className="text-xs text-gray-500">※別途費用がかかります</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">税理士・会計士紹介</h3>
              <p className="text-gray-700 text-sm mb-4">
                税務・会計の専門家をご紹介。節税対策や財務デューデリジェンスに対応します。
              </p>
              <p className="text-xs text-gray-500">※別途費用がかかります</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">技術DD（技術監査）</h3>
              <p className="text-gray-700 text-sm mb-4">
                エンジニアによる技術面の詳細調査。コード品質やセキュリティを確認します。
              </p>
              <p className="text-xs text-gray-500">※別途費用がかかります</p>
            </div>
          </div>
        </div>

        {/* サポート料金 */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">サポート料金</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">基本サポート</span>
                <span className="text-2xl font-bold">無料</span>
              </div>
              <p className="text-sm text-gray-300">
                説明会、相談会、専任担当によるサポートはすべて無料でご利用いただけます
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">取引成立時の手数料</span>
                <span className="text-xl font-bold">売り手: 10% / 買い手: 5%</span>
              </div>
              <p className="text-sm text-gray-300">
                成約時のみ手数料が発生します。成約しない場合は一切費用はかかりません
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">まずは無料相談から</h2>
          <p className="text-gray-600 mb-6">
            専門スタッフが、あなたの状況に合わせた最適なサポートをご提案します
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              無料相談を申し込む
            </Link>
            <Link
              href="/seminar"
              className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              説明会に参加する
            </Link>
          </div>
        </div>
      </div>
    </div>
      ) : (
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Services</h1>
          <p className="text-xl text-gray-600">
            Comprehensive support to ensure successful app and web service transactions
          </p>
        </div>

        {/* Support Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dedicated Account Manager</h3>
            <p className="text-gray-600 text-sm">
              Experienced staff provides consistent support from listing to closing
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe & Secure</h3>
            <p className="text-gray-600 text-sm">
              Support for contract creation, due diligence, and escrow services ensures safe transactions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h3>
            <p className="text-gray-600 text-sm">
              Quick matching and smooth transaction progress for the fastest possible closing
            </p>
          </div>
        </div>

        {/* Services List */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>

          <div className="space-y-8">
            {/* Seller Support */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Seller Support Services</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">1</span>
                    Valuation & Market Advice
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Based on historical transaction data and market trends, we advise on appropriate selling prices to support high-value sales.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Analysis of comparable transaction prices</li>
                    <li>• Sale price simulation</li>
                    <li>• Pricing strategy development</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">2</span>
                    Listing Materials Creation Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for creating attractive listing pages. Experts advise on key points that attract buyers.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Organization of selling points</li>
                    <li>• Material template provision</li>
                    <li>• Review and feedback</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">3</span>
                    Buyer Matching
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Actively introduce qualified buyer candidates. Achieve smooth matching.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Buyer database utilization</li>
                    <li>• Condition matching</li>
                    <li>• Negotiation facilitation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">4</span>
                    Due Diligence Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for responding to buyer questions and preparing materials. Proceed with transactions confidently.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Required documents checklist</li>
                    <li>• Question response support</li>
                    <li>• Information disclosure scope advice</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">5</span>
                    Contract Creation & Negotiation Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Experts support from contract term negotiation to contract creation.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Contract template provision</li>
                    <li>• Term negotiation advice</li>
                    <li>• Attorney referral (optional)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 text-xs text-orange-600">6</span>
                    Handover Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for smooth handover after closing. Prevent issues before they occur.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Handover checklist</li>
                    <li>• Technical transfer support</li>
                    <li>• After-sales follow-up</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Buyer Support */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Buyer Support Services</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">1</span>
                    Project Introduction & Matching
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Actively introduce projects that match your preferences. Priority access to unlisted projects.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Requirement gathering</li>
                    <li>• Unlisted project introduction</li>
                    <li>• Priority notification of new listings</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">2</span>
                    Project Analysis & Evaluation Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for analyzing and evaluating projects of interest. Provide information needed for purchase decisions.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Profitability analysis</li>
                    <li>• Growth potential evaluation</li>
                    <li>• Risk factor identification</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">3</span>
                    Due Diligence Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for detailed technical and business investigations. Expert verification can be arranged.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Verification checklist</li>
                    <li>• Technical DD (audit) support</li>
                    <li>• Expert referral</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">4</span>
                    Price Negotiation Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Achieve purchase at fair prices. Advise on key negotiation points.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Market pricing information</li>
                    <li>• Negotiation strategy development</li>
                    <li>• Term adjustment mediation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">5</span>
                    Contract & Payment Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support for safe transactions from contract review to payment.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Contract review</li>
                    <li>• Escrow services</li>
                    <li>• Payment method advice</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs text-blue-600">6</span>
                    Handover & Operations Support
                  </h4>
                  <p className="text-gray-700 text-sm mb-4">
                    Support from post-purchase handover to operational launch. Operation management services available if needed.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Handover schedule management</li>
                    <li>• Technical support</li>
                    <li>• Operation management service (optional)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Services */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Optional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Attorney Referral</h3>
              <p className="text-gray-700 text-sm mb-4">
                Referral to attorneys experienced in M&A. Support for contract creation and legal review.
              </p>
              <p className="text-xs text-gray-500">* Additional fees apply</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Tax Accountant Referral</h3>
              <p className="text-gray-700 text-sm mb-4">
                Referral to tax and accounting experts. Support for tax planning and financial due diligence.
              </p>
              <p className="text-xs text-gray-500">* Additional fees apply</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Technical DD (Audit)</h3>
              <p className="text-gray-700 text-sm mb-4">
                Detailed technical investigation by engineers. Verify code quality and security.
              </p>
              <p className="text-xs text-gray-500">* Additional fees apply</p>
            </div>
          </div>
        </div>

        {/* Support Pricing */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center">Support Pricing</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 rounded-lg p-6 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Basic Support</span>
                <span className="text-2xl font-bold">Free</span>
              </div>
              <p className="text-sm text-gray-300">
                Seminars, consultations, and dedicated account manager support are all available for free
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Transaction Success Fee</span>
                <span className="text-xl font-bold">Seller: 10% / Buyer: 5%</span>
              </div>
              <p className="text-sm text-gray-300">
                Fees only apply upon successful transaction. No fees if the deal doesn't close
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start with a Free Consultation</h2>
          <p className="text-gray-600 mb-6">
            Our expert staff will propose the best support tailored to your situation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Request Free Consultation
            </Link>
            <Link
              href="/seminar"
              className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Attend Seminar
            </Link>
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  )
}
