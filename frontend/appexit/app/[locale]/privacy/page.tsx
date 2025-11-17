import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;
  const legalDict = await loadPageDictionary(locale, 'legal');
  const tp = createPageDictHelper(legalDict);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{tp('privacy.title')}</h1>

          {locale === 'ja' ? (
            <div className="prose max-w-none">
              <p className="mb-6">
                Queue株式会社（以下「当社」といいます。）は、当社の提供するサービス「APPEXIT」（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第1条（個人情報）</h2>
              <p className="mb-4">
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第2条（個人情報の収集方法）</h2>
              <p className="mb-4">
                当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下「提携先」といいます。）などから収集することがあります。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第3条（個人情報を収集・利用する目的）</h2>
              <p className="mb-2">
                当社が個人情報を収集・利用する目的は、以下のとおりです。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                <li>有料サービスにおいて、ユーザーに利用料金を請求するため</li>
                <li>上記の利用目的に付随する目的</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第4条（利用目的の変更）</h2>
              <p className="mb-4">
                当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第5条（個人情報の第三者提供）</h2>
              <p className="mb-2">
                当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>利用目的に第三者への提供を含むこと</li>
                <li>第三者に提供されるデータの項目</li>
                <li>第三者への提供の手段または方法</li>
                <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                <li>本人の求めを受け付ける方法</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">第6条（個人情報の開示）</h2>
              <p className="mb-4">
                当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。なお、個人情報の開示に際しては、1件あたり1,000円の手数料を申し受けます。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>本人または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合</li>
                <li>当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合</li>
                <li>その他法令に違反することとなる場合</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第7条（個人情報の訂正および削除）</h2>
              <p className="mb-4">
                ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。当社は、ユーザーから前項の請求を受けてその請求に理由があると判断した場合には、遅滞なく、当該個人情報の訂正等を行うものとします。当社は、前項の規定に基づき訂正等を行った場合、または訂正等を行わない旨の決定をしたときは遅滞なく、これをユーザーに通知します。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第8条（個人情報の利用停止等）</h2>
              <p className="mb-4">
                当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行います。前項の調査結果に基づき、その請求に理由があると判断した場合には、遅滞なく、当該個人情報の利用停止等を行います。当社は、前項の規定に基づき利用停止等を行った場合、または利用停止等を行わない旨の決定をしたときは、遅滞なく、これをユーザーに通知します。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第9条（プライバシーポリシーの変更）</h2>
              <p className="mb-4">
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第10条（Cookieの使用について）</h2>
              <p className="mb-4">
                当社は、ユーザーに最適なサービス提供を行うため、Cookieを使用しています。Cookieとは、ウェブサイトが皆様のコンピュータのハードディスク上に置かれる小さなファイルです。Cookieは皆様を特定するものではありません。また、皆様のブラウザの設定により、Cookieの受け取りを拒否したり、Cookieを受け取ったとき警告を表示させることができます。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第11条（お問い合わせ窓口）</h2>
              <p className="mb-4">
                本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 font-semibold">Queue株式会社</p>
                <p className="text-gray-700">個人情報保護管理責任者</p>
                <p className="text-gray-700">メールアドレス：privacy@appexit.jp</p>
                <p className="text-gray-700">住所：〒104-0061 東京都中央区銀座８丁目17-5THE HUB 銀座 OCT</p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">制定日：2025年11月1日</p>
                <p className="text-sm text-gray-500">最終改訂日：2025年11月1日</p>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <p className="mb-6">
                Queue Inc. (hereinafter referred to as "the Company") establishes this Privacy Policy (hereinafter referred to as "this Policy") regarding the handling of users' personal information in the service "APPEXIT" (hereinafter referred to as "the Service") provided by the Company.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 1 (Personal Information)</h2>
              <p className="mb-4">
                "Personal Information" refers to "personal information" as defined in the Act on the Protection of Personal Information, and is information about living individuals that can identify specific individuals by the name, date of birth, address, telephone number, contact information, and other descriptions contained in such information, as well as data relating to appearance, fingerprints, and voiceprints, and information (personal identification information) that can identify specific individuals from such information alone, such as health insurance card insurer numbers.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 2 (Methods of Collecting Personal Information)</h2>
              <p className="mb-4">
                The Company may ask for personal information such as name, date of birth, address, telephone number, email address, bank account number, credit card number, and driver's license number when users register for use. The Company may also collect transaction records and payment information, including users' personal information, made between users and partners, etc., from the Company's partners (including information providers, advertisers, ad distribution destinations, etc.; hereinafter referred to as "Partners").
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 3 (Purpose of Collecting and Using Personal Information)</h2>
              <p className="mb-2">
                The purposes for which the Company collects and uses personal information are as follows:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>To provide and operate the Company's services</li>
                <li>To respond to inquiries from users (including identity verification)</li>
                <li>To send emails about new features, updates, campaigns, etc. of the service being used by users, and information about other services provided by the Company</li>
                <li>To contact users as necessary, such as for maintenance and important notices</li>
                <li>To identify users who have violated the Terms of Service or who attempt to use the service for fraudulent or improper purposes, and to refuse their use</li>
                <li>To allow users to view, change, or delete their own registration information, and to view their usage status</li>
                <li>To bill users for usage fees for paid services</li>
                <li>Purposes incidental to the above purposes of use</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 4 (Change of Purpose of Use)</h2>
              <p className="mb-4">
                The Company shall change the purpose of use of personal information only when it is reasonably recognized that the purpose of use is related to the purpose before the change. If the purpose of use is changed, the Company shall notify users of the changed purpose or publish it on this website by the method specified by the Company.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 5 (Provision of Personal Information to Third Parties)</h2>
              <p className="mb-2">
                The Company will not provide personal information to third parties without obtaining prior consent from users, except in the following cases. However, this excludes cases permitted by the Act on the Protection of Personal Information and other laws and regulations.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>When it is necessary for the protection of the life, body, or property of an individual and it is difficult to obtain the consent of the person</li>
                <li>When it is particularly necessary for improving public health or promoting the sound growth of children and it is difficult to obtain the consent of the person</li>
                <li>When it is necessary to cooperate with a national agency, a local government, or a person entrusted by them in performing affairs prescribed by laws and regulations, and obtaining the consent of the person may interfere with the performance of such affairs</li>
                <li>When the following matters have been announced or published in advance and the Company has notified the Personal Information Protection Commission</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>That the purpose of use includes provision to third parties</li>
                <li>Items of data to be provided to third parties</li>
                <li>Means or methods of provision to third parties</li>
                <li>That provision of personal information to third parties will be stopped at the request of the person</li>
                <li>Method of accepting requests from the person</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 6 (Disclosure of Personal Information)</h2>
              <p className="mb-4">
                When the Company is requested by a person to disclose personal information, the Company will disclose it to the person without delay. However, if disclosure falls under any of the following cases, the Company may not disclose all or part of it, and if the Company decides not to disclose it, the Company will notify the person to that effect without delay. A fee of 1,000 yen per case will be charged for disclosure of personal information.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>When there is a risk of harming the life, body, property, or other rights and interests of the person or a third party</li>
                <li>When there is a risk of significantly impeding the proper implementation of the Company's business</li>
                <li>When it would violate other laws and regulations</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 7 (Correction and Deletion of Personal Information)</h2>
              <p className="mb-4">
                If the personal information held by the Company about a user is incorrect, the user may request the Company to correct, add, or delete (hereinafter referred to as "correction, etc.") the personal information according to the procedures determined by the Company. If the Company receives a request from a user under the preceding paragraph and determines that there is a reason for the request, the Company will correct the personal information without delay. If the Company makes corrections, etc. based on the provisions of the preceding paragraph, or decides not to make corrections, etc., the Company will notify the user to that effect without delay.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 8 (Suspension of Use of Personal Information)</h2>
              <p className="mb-4">
                If the Company is requested by a person to suspend or delete the use of personal information (hereinafter referred to as "suspension of use, etc.") on the grounds that the personal information is being handled beyond the scope of the purpose of use or that it was obtained by fraudulent means, the Company will conduct the necessary investigation without delay. If, based on the results of the investigation in the preceding paragraph, it is determined that there is a reason for the request, the Company will suspend the use of the personal information without delay. If the Company suspends the use, etc. based on the provisions of the preceding paragraph, or decides not to suspend the use, etc., the Company will notify the user to that effect without delay.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 9 (Changes to the Privacy Policy)</h2>
              <p className="mb-4">
                The contents of this Policy may be changed without notice to users, except for matters otherwise provided for in laws and regulations and other matters stipulated in this Policy. Unless otherwise determined by the Company, the changed Privacy Policy shall become effective when posted on this website.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 10 (Use of Cookies)</h2>
              <p className="mb-4">
                The Company uses cookies to provide optimal services to users. Cookies are small files that websites place on your computer's hard disk. Cookies do not identify you. Also, depending on your browser settings, you can refuse to receive cookies or display a warning when you receive a cookie.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 11 (Contact for Inquiries)</h2>
              <p className="mb-4">
                For inquiries regarding this Policy, please contact the following:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 font-semibold">Queue Inc.</p>
                <p className="text-gray-700">Personal Information Protection Manager</p>
                <p className="text-gray-700">Email: privacy@appexit.jp</p>
                <p className="text-gray-700">Address: THE HUB Ginza OCT, 8-17-5 Ginza, Chuo-ku, Tokyo 104-0061, Japan</p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Established: November 1, 2025</p>
                <p className="text-sm text-gray-500">Last Revised: November 1, 2025</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}