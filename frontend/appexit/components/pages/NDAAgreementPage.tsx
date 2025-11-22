'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { profileApi } from '@/lib/api-client';

export default function NDAAgreementPage() {
  const t = useTranslations('nda');
  const locale = useLocale();
  const { profile, loading: authLoading, refreshSession } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  // プロフィールのnda_flagを確認して、既に同意済みの場合はチェックボックスをオンにする
  useEffect(() => {
    if (profile?.nda_flag) {
      setAgreed(true);
    }
  }, [profile?.nda_flag]);

  const handleAgree = async () => {
    // チェックが入っていない場合は処理しない
    if (!agreed) {
      return;
    }
    
    setIsUpdating(true);
    try {
      // NDAフラグをtrueに更新
      await profileApi.updateProfile({ nda_flag: true });
      // セッションをリフレッシュして最新のプロフィールを取得
      await refreshSession();
      // 同意が完了したら、前のページに戻るか、指定のページに遷移
      router.back();
    } catch (error) {
      console.error('Failed to update NDA flag:', error);
      alert(t('failedToUpdate'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    // チェックボックスの変更はローカル状態のみ更新
    // 実際の保存は「同意する」ボタンを押したときに行う
    setAgreed(checked);
  };

  // 既に同意済みかどうか
  const isAlreadySigned = profile?.nda_flag === true;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white">
          {/* タイトル */}
          <div className="text-center mb-12 border-b-2 pb-6" style={{ borderColor: '#323232' }}>
            <h1 className="text-2xl font-bold mb-2 tracking-wide" style={{ color: '#323232' }}>
              {t('ndaTitle')}
            </h1>
            <p className="text-sm mt-2" style={{ color: '#323232' }}>
              {t('ndaSubtitle')}
            </p>
            {isAlreadySigned && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-md">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-800">{t('signed')}</span>
              </div>
            )}
          </div>

          {/* 契約書本文 */}
          <div className="leading-relaxed" style={{ color: '#323232' }}>
            {locale === 'ja' ? (
              <>
                {/* 前文 */}
                <div className="mb-10 text-sm">
                  <p className="mb-4">
                    本契約は、Queue株式会社（以下「開示者」という）と、本サービスを利用するユーザー（以下「受領者」という）との間で、開示者が受領者に対して開示する秘密情報の取り扱いについて定めるものである。
                  </p>
                </div>

                {/* 当事者 */}
                <div className="mb-10 border-b pb-6" style={{ borderColor: '#323232' }}>
                  <h2 className="text-base font-bold mb-4">当事者</h2>
                  <div className="mb-4 text-sm">
                    <p className="font-semibold mb-2">開示者（Discloser）</p>
                    <p>Queue株式会社</p>
                    <p>代表取締役 谷口太一</p>
                    <p>〒104-0061 東京都中央区銀座８丁目17-5</p>
                    <p>THE HUB 銀座 OCT</p>
                    <p className="mt-2">電話番号：03-5324-2678</p>
                    <p>メールアドレス：support@appexit.jp</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold mb-2">受領者（Recipient）</p>
                    <p>本サービスを利用するユーザー</p>
                  </div>
                </div>

                {/* 条項 */}
                <div className="space-y-8 text-sm">
                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第1条（目的）</h2>
                    <p className="leading-7">
                      本契約は、開示者が受領者に対して開示する秘密情報の取り扱いについて定めることを目的とする。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第2条（秘密情報の定義）</h2>
                    <p className="leading-7 mb-3">
                      本契約において「秘密情報」とは、開示者が受領者に対して開示する、技術上、営業上、その他業務上の一切の情報（プロダクト・アプリケーションのソースコード、設計書、顧客情報、売上情報、技術情報、財務情報、マーケティング情報、ビジネスプラン、戦略情報等を含むがこれらに限られない）をいう。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第3条（秘密保持義務）</h2>
                    <p className="leading-7">
                      受領者は、秘密情報を厳に秘密として保持し、開示者の事前の書面による承諾なく、第三者に開示、漏洩、提供してはならない。また、受領者は、秘密情報を本契約の目的以外に使用してはならない。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第4条（秘密情報の例外）</h2>
                    <p className="leading-7 mb-3">
                      以下の情報は秘密情報に該当しないものとする：
                    </p>
                    <ol className="list-decimal list-inside ml-4 space-y-1 leading-7">
                      <li>開示時に既に公知であった情報</li>
                      <li>開示後、受領者の責めに帰すべき事由によらず公知となった情報</li>
                      <li>開示時に既に受領者が保有していた情報</li>
                      <li>正当な権限を有する第三者から秘密保持義務を負うことなく入手した情報</li>
                      <li>受領者が開示者の秘密情報に依らずに独自に開発した情報</li>
                    </ol>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第5条（秘密情報の管理）</h2>
                    <p className="leading-7">
                      受領者は、秘密情報を自己の秘密情報と同等の注意義務をもって管理するものとする。受領者は、秘密情報へのアクセスを必要最小限の者に限定し、適切なセキュリティ対策を講じるものとする。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第6条（有効期間）</h2>
                    <p className="leading-7">
                      本契約の有効期間は、契約締結日から5年間とする。ただし、秘密保持義務は、秘密情報の開示後5年間継続するものとする。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第7条（損害賠償）</h2>
                    <p className="leading-7">
                      受領者が本契約に違反したことにより開示者に損害が生じた場合、受領者は、開示者に対し、当該損害を賠償する責任を負うものとする。また、開示者は、受領者の違反行為により生じた損害について、受領者に対して損害賠償請求を行うことができるものとする。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第8条（差止請求）</h2>
                    <p className="leading-7">
                      受領者が本契約に違反するおそれがある場合、開示者は、受領者に対して、当該違反行為の差止めを請求することができるものとする。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第9条（返還・廃棄）</h2>
                    <p className="leading-7">
                      開示者の要求があった場合、受領者は、秘密情報の写し、複製物、記録媒体等を遅滞なく返還し、または廃棄するものとする。ただし、受領者が法令により保存義務を負う場合は、この限りではない。
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">第10条（準拠法・管轄裁判所）</h2>
                    <p className="leading-7">
                      本契約は日本法に準拠するものとし、本契約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とする。
                    </p>
                  </div>
                </div>

                {/* 日付 */}
                <div className="mt-12 mb-8 text-sm">
                  <p>制定日：2025年11月1日</p>
                  <p>最終改訂日：2025年11月1日</p>
                </div>
              </>
            ) : (
              <>
                {/* Preamble */}
                <div className="mb-10 text-sm">
                  <p className="mb-4">
                    This agreement is entered into between Queue Inc. (hereinafter referred to as "Discloser") and users who use this service (hereinafter referred to as "Recipient") regarding the handling of confidential information disclosed by the Discloser to the Recipient.
                  </p>
                </div>

                {/* Parties */}
                <div className="mb-10 border-b pb-6" style={{ borderColor: '#323232' }}>
                  <h2 className="text-base font-bold mb-4">Parties</h2>
                  <div className="mb-4 text-sm">
                    <p className="font-semibold mb-2">Discloser</p>
                    <p>Queue Inc.</p>
                    <p>Representative Director: Taichi Taniguchi</p>
                    <p>THE HUB Ginza OCT</p>
                    <p>8-17-5 Ginza, Chuo-ku</p>
                    <p>Tokyo 104-0061, Japan</p>
                    <p className="mt-2">Phone: +81-3-5324-2678</p>
                    <p>Email: support@appexit.jp</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold mb-2">Recipient</p>
                    <p>Users who use this service</p>
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-8 text-sm">
                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 1 (Purpose)</h2>
                    <p className="leading-7">
                      This agreement is intended to define the handling of confidential information disclosed by the Discloser to the Recipient.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 2 (Definition of Confidential Information)</h2>
                    <p className="leading-7">
                      "Confidential Information" under this agreement refers to all information disclosed by the Discloser to the Recipient, including but not limited to technical, commercial, and other business information (including product and application source code, design documents, customer information, sales information, technical information, financial information, marketing information, business plans, strategic information, etc.).
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 3 (Confidentiality Obligation)</h2>
                    <p className="leading-7">
                      The Recipient shall maintain confidential information in strict confidence and shall not disclose, leak, or provide it to third parties without the prior written consent of the Discloser. Furthermore, the Recipient shall not use the confidential information for purposes other than those specified in this agreement.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 4 (Exceptions to Confidential Information)</h2>
                    <p className="leading-7 mb-3">
                      The following information shall not be considered confidential information:
                    </p>
                    <ol className="list-decimal list-inside ml-4 space-y-1 leading-7">
                      <li>Information that was publicly known at the time of disclosure</li>
                      <li>Information that became publicly known after disclosure without fault on the part of the Recipient</li>
                      <li>Information already possessed by the Recipient at the time of disclosure</li>
                      <li>Information obtained from a third party with proper authority without confidentiality obligations</li>
                      <li>Information independently developed by the Recipient without relying on the Discloser's confidential information</li>
                    </ol>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 5 (Management of Confidential Information)</h2>
                    <p className="leading-7">
                      The Recipient shall manage confidential information with the same duty of care as their own confidential information. The Recipient shall limit access to confidential information to the minimum necessary persons and implement appropriate security measures.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 6 (Term of Validity)</h2>
                    <p className="leading-7">
                      The term of this agreement shall be five years from the date of conclusion. However, the confidentiality obligation shall continue for five years after disclosure of the confidential information.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 7 (Damages)</h2>
                    <p className="leading-7">
                      If the Discloser suffers damages due to the Recipient's violation of this agreement, the Recipient shall be liable to compensate the Discloser for such damages. The Discloser may claim damages against the Recipient for damages caused by the Recipient's violation.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 8 (Injunction)</h2>
                    <p className="leading-7">
                      If there is a risk that the Recipient will violate this agreement, the Discloser may request the Recipient to cease such violation.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 9 (Return and Disposal)</h2>
                    <p className="leading-7">
                      Upon request by the Discloser, the Recipient shall promptly return or dispose of copies, reproductions, recording media, etc. of confidential information. However, this shall not apply when the Recipient is obligated to retain such information by law.
                    </p>
                  </div>

                  <div className="border-b border-gray-300 pb-4">
                    <h2 className="text-base font-bold mb-3">Article 10 (Governing Law and Jurisdiction)</h2>
                    <p className="leading-7">
                      This agreement shall be governed by Japanese law, and the Tokyo District Court shall have exclusive jurisdiction as the court of first instance for all disputes relating to this agreement.
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="mt-12 mb-8 text-sm">
                  <p>Established: November 1, 2025</p>
                  <p>Last Revised: November 1, 2025</p>
                </div>
              </>
            )}
          </div>

          {/* 同意欄 */}
          <div className="mt-16 border-t-2 pt-8" style={{ borderColor: '#323232' }}>
            {isAlreadySigned ? (
              // 同意済みの場合
              <div>
                <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-base font-semibold text-green-800">
                      {locale === 'ja' ? '同意済み' : 'Agreement Signed'}
                    </p>
                  </div>
                  <p className="text-sm text-green-700 leading-6">
                    {locale === 'ja'
                      ? 'あなたは既にこの秘密保持契約に同意しています。'
                      : 'You have already agreed to this Non-Disclosure Agreement.'}
                  </p>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-3 border-2 text-sm font-medium hover:bg-gray-50 transition-colors rounded-sm"
                    style={{ borderColor: '#323232', color: '#323232' }}
                  >
                    {locale === 'ja' ? '戻る' : 'Back'}
                  </button>
                </div>
              </div>
            ) : (
              // 未同意の場合
              <div>
                <div className="mb-8">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => handleCheckboxChange(e.target.checked)}
                      disabled={authLoading || isUpdating}
                      className="mt-1 w-5 h-5 border-2 rounded-none focus:ring-0 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ borderColor: '#323232', accentColor: '#323232' }}
                    />
                    <div className="flex-1">
                      <p className="text-sm leading-6" style={{ color: '#323232' }}>
                        {locale === 'ja'
                          ? '私は上記の秘密保持契約書の内容を読み、理解し、これに同意します。'
                          : 'I have read, understood, and agree to the above Non-Disclosure Agreement.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* ボタン */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border-2 text-sm font-medium hover:bg-gray-50 transition-colors rounded-sm"
                    style={{ borderColor: '#323232', color: '#323232' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAgree}
                    disabled={!agreed || authLoading || isUpdating}
                    className={`flex-1 px-6 py-3 border-2 text-sm font-medium transition-colors rounded-sm ${
                      agreed && !authLoading && !isUpdating
                        ? 'text-white hover:opacity-90'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                    style={agreed && !authLoading && !isUpdating ? { backgroundColor: '#323232', borderColor: '#323232' } : { borderColor: '#d1d5db' }}
                  >
                    {isUpdating
                      ? t('updating')
                      : t('iAgree')
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

