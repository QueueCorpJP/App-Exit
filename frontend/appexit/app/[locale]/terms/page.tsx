import { getTranslations } from 'next-intl/server';
import { loadPageDictionary } from '@/lib/i18n-utils';
import { createPageDictHelper } from '@/lib/page-dict';
import type { Locale } from '@/i18n/config';

export default async function TermsOfServicePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const t = await getTranslations();
  const { locale } = await params;
  const legalDict = await loadPageDictionary(locale, 'legal');
  const tp = createPageDictHelper(legalDict);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{tp('terms.title')}</h1>

          {locale === 'ja' ? (
            <div className="prose max-w-none">
              <p className="mb-6">
                この利用規約（以下「本規約」といいます。）は、Queue株式会社（以下「当社」といいます。）がこのウェブサイト上で提供するサービス「APPEXIT」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第1条（適用）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</li>
                <li>当社は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下「個別規定」といいます。）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。</li>
                <li>本規約の規定が前条の個別規定の規定と矛盾する場合には、個別規定において特段の定めなき限り、個別規定の規定が優先されるものとします。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第2条（利用登録）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
                <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>未成年者、成年被後見人、被保佐人または被補助人からの申請であり、法定代理人、後見人、保佐人または補助人の同意等を得ていない場合</li>
                <li>反社会的勢力等（暴力団、暴力団員、右翼団体、反社会的勢力、その他これに準ずる者を意味します。以下同じ。）である、または資金提供その他を通じて反社会的勢力等の維持、運営もしくは経営に協力もしくは関与する等反社会的勢力等との何らかの交流もしくは関与を行っていると当社が判断した場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
                <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
                <li>ユーザーID及びパスワードが第三者によって使用されたことによって生じた損害は、当社に故意又は重大な過失がある場合を除き、当社は一切の責任を負わないものとします。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第4条（利用料金および支払方法）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。</li>
                <li>ユーザーが利用料金の支払を遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</li>
                <li>プロジェクトが成立した場合、当社は成立時点での支援総額に対して所定の決済手数料およびプラットフォーム利用料を申し受けます。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第5条（禁止事項）</h2>
              <p className="text-gray-700 mb-2">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等、本サービスに含まれる著作権、商標権その他の知的財産権を侵害する行為</li>
                <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正な目的を持って本サービスを利用する行為</li>
                <li>本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>当社が許諾しない本サービス上での宣伝、広告、勧誘、または営業行為</li>
                <li>面識のない異性との出会いを目的とした行為</li>
                <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>虚偽の情報を登録する行為</li>
                <li>資金調達の目的が不明確または実現可能性が著しく低いプロジェクトを掲載する行為</li>
                <li>リターンの提供が困難または不可能なプロジェクトを掲載する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第6条（本サービスの提供の停止等）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
              <p className="text-gray-700 mt-4">
                当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第7条（プロジェクトの審査・承認）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社は、ユーザーが投稿するプロジェクトについて、当社の定める基準に基づいて審査を行い、公開の可否を決定します。</li>
                <li>当社は、以下の場合にはプロジェクトの公開を承認しない場合があります。</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>法令に違反する、または違反するおそれがある内容を含む場合</li>
                <li>公序良俗に反する内容を含む場合</li>
                <li>第三者の権利を侵害する、または侵害するおそれがある場合</li>
                <li>虚偽の情報が含まれている場合</li>
                <li>実現可能性が著しく低いと判断される場合</li>
                <li>その他当社が不適切と判断する場合</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">第8条（知的財産権）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>本サービスによって提供される情報、テキスト、画像、動画等に関する権利（著作権、商標権等の知的財産権を含みますがこれらに限定されません）は当社または当社にその利用を許諾した権利者に帰属し、ユーザーは無断で複製、譲渡、貸与、翻訳、改変、転載、公衆送信（送信可能化を含みます）、伝送、配布、出版、営業使用等をしてはならないものとします。</li>
                <li>ユーザーは、ユーザーが本サービスに投稿したコンテンツについて、当社が本サービスの提供、維持、改善および新サービスの開発等に必要な範囲内で利用することを許諾するものとします。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第9条（利用制限および登録抹消）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知または催告なしに、投稿データを削除し、ユーザーに対して本サービスの全部もしくは一部の利用を制限しまたはユーザーとしての登録を抹消することができるものとします。</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>本規約のいずれかの条項に違反した場合</li>
                <li>登録事項に虚偽の事実があることが判明した場合</li>
                <li>決済手段として当該ユーザーが届け出たクレジットカードが利用停止となった場合</li>
                <li>料金等の支払債務の不履行があった場合</li>
                <li>当社からの連絡に対し、一定期間返答がない場合</li>
                <li>本サービスについて、最後の利用から一定期間利用がない場合</li>
                <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
              </ul>
              <p className="text-gray-700 mt-4">
                当社は、本条に基づき当社が行った行為によりユーザーに生じた損害について、一切の責任を負いません。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第10条（抜けがけ・直接取引の禁止）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>売り手および買い手は、App Exit上で知り得た他のユーザー・案件・取引情報を用いて、App Exitを介さずに直接取引・交渉・連絡を行ってはならないものとします。</li>
                <li>前項に違反し、App Exitを経由せずに取引が成立した場合、当該ユーザーはApp Exitに対し、本来発生する手数料の3倍相当額または300万円のいずれか高い方を違約金として支払うものとします。</li>
                <li>運営は、違反者に対し、即時のアカウント停止・永久退会・法的措置（損害賠償請求・訴訟等）を行うことができます。</li>
                <li>本条は、取引交渉開始日から2年間有効とします。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第11条（退会）</h2>
              <p className="text-gray-700 mb-4">
                ユーザーは、当社の定める退会手続により、本サービスから退会できるものとします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第12条（保証の否認および免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
                <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。</li>
                <li>前項ただし書に定める場合であっても、当社は、当社の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（当社またはユーザーが損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">第13条（サービス内容の変更等）</h2>
              <p className="text-gray-700 mb-4">
                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第14条（利用規約の変更）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>本規約の変更がユーザーの一般の利益に適合するとき。</li>
                <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。</li>
              </ul>
              <p className="text-gray-700 mt-4">
                当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨及び変更後の本規約の内容並びにその効力発生時期を通知いたします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第15条（個人情報の取扱い）</h2>
              <p className="text-gray-700 mb-4">
                当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第16条（通知または連絡）</h2>
              <p className="text-gray-700 mb-4">
                ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第17条（権利義務の譲渡の禁止）</h2>
              <p className="text-gray-700 mb-4">
                ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">第18条（準拠法・裁判管轄）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
                <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
              </ol>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">制定日：2025年11月1日</p>
                <p className="text-sm text-gray-500">最終改訂日：2025年11月1日</p>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <p className="mb-6">
                These Terms of Service (hereinafter referred to as "these Terms") set forth the terms and conditions for the use of the service "APPEXIT" (hereinafter referred to as "the Service") provided by Queue Inc. (hereinafter referred to as "the Company") on this website. All registered users (hereinafter referred to as "Users") shall use the Service in accordance with these Terms.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 1 (Application)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>These Terms shall apply to all relationships between Users and the Company regarding the use of the Service.</li>
                <li>In addition to these Terms, the Company may establish various rules and regulations (hereinafter referred to as "Individual Provisions") regarding the use of the Service. These Individual Provisions, regardless of their names, shall constitute a part of these Terms.</li>
                <li>If the provisions of these Terms contradict the provisions of the Individual Provisions mentioned in the previous paragraph, the provisions of the Individual Provisions shall prevail unless otherwise specified in the Individual Provisions.</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 2 (User Registration)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>In this Service, registration shall be completed when a prospective registrant agrees to these Terms, applies for user registration by the method prescribed by the Company, and the Company approves such application.</li>
                <li>The Company may refuse to approve an application for user registration if it determines that the applicant has any of the following reasons, and shall not be obligated to disclose any reason for such refusal.</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>When false information is provided in the application for user registration</li>
                <li>When the application is from a person who has violated these Terms</li>
                <li>When the application is from a minor, adult ward, person under curatorship, or person under assistance without consent from their legal representative, guardian, curator, or assistant</li>
                <li>When the Company determines that the applicant is or has been involved with anti-social forces (meaning organized crime groups, members of organized crime groups, right-wing organizations, anti-social forces, or similar entities)</li>
                <li>When the Company otherwise determines that user registration is not appropriate</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 3 (Management of User ID and Password)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Users shall appropriately manage their user IDs and passwords for the Service at their own responsibility.</li>
                <li>Users may not transfer, lend, or share their user IDs and passwords with third parties under any circumstances. The Company shall deem any login using a user ID and password combination that matches the registered information as use by the User who registered that user ID.</li>
                <li>The Company shall not be liable for any damages caused by the use of user IDs and passwords by third parties, except when the Company has intent or gross negligence.</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 4 (Usage Fees and Payment Methods)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Users shall pay the usage fees separately determined by the Company and displayed on this website for the paid portions of the Service by the method specified by the Company.</li>
                <li>If a User delays payment of usage fees, the User shall pay late payment damages at an annual rate of 14.6%.</li>
                <li>When a project is established, the Company shall receive the prescribed payment processing fees and platform usage fees for the total amount of support at the time of establishment.</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 5 (Prohibited Acts)</h2>
              <p className="text-gray-700 mb-2">
                Users shall not engage in the following acts when using the Service:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Acts that violate laws or public order and morals</li>
                <li>Acts related to criminal activities</li>
                <li>Acts that infringe on copyrights, trademarks, or other intellectual property rights included in the Service</li>
                <li>Acts that destroy or interfere with the functions of servers or networks of the Company, other Users, or other third parties</li>
                <li>Acts of commercially using information obtained through the Service</li>
                <li>Acts that may interfere with the operation of the Company's services</li>
                <li>Acts of unauthorized access or attempts thereof</li>
                <li>Acts of collecting or accumulating personal information about other Users</li>
                <li>Acts of using the Service for fraudulent purposes</li>
                <li>Acts that cause disadvantage, damage, or discomfort to other Users or other third parties</li>
                <li>Acts of impersonating other Users</li>
                <li>Acts of advertisement, publicity, solicitation, or business activities on the Service not authorized by the Company</li>
                <li>Acts aimed at meeting strangers of the opposite sex</li>
                <li>Acts of directly or indirectly providing benefits to anti-social forces in connection with the Company's services</li>
                <li>Acts of registering false information</li>
                <li>Acts of posting projects with unclear fundraising purposes or significantly low feasibility</li>
                <li>Acts of posting projects for which it is difficult or impossible to provide returns</li>
                <li>Other acts deemed inappropriate by the Company</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 6 (Suspension of Service Provision)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>The Company may suspend or interrupt the provision of all or part of the Service without prior notice to Users if it determines that any of the following reasons exists:</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>When performing maintenance, inspection, or updates of computer systems related to the Service</li>
                <li>When it becomes difficult to provide the Service due to force majeure such as earthquakes, lightning, fire, power outages, or natural disasters</li>
                <li>When computers or communication lines stop due to accidents</li>
                <li>When the Company otherwise determines that it is difficult to provide the Service</li>
              </ul>
              <p className="text-gray-700 mt-4">
                The Company shall not be liable for any disadvantage or damage suffered by Users or third parties due to the suspension or interruption of the Service provision.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 7 (Project Review and Approval)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>The Company shall review projects posted by Users based on the Company's established criteria and determine whether to approve their publication.</li>
                <li>The Company may not approve the publication of projects in the following cases:</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>When the content violates or may violate laws</li>
                <li>When the content is contrary to public order and morals</li>
                <li>When it infringes or may infringe on third-party rights</li>
                <li>When false information is included</li>
                <li>When the feasibility is deemed to be significantly low</li>
                <li>When the Company otherwise deems it inappropriate</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 8 (Intellectual Property Rights)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Rights to information, text, images, videos, etc. provided by the Service (including but not limited to copyrights and trademarks) belong to the Company or rights holders who have authorized the Company to use them, and Users shall not reproduce, transfer, lend, translate, modify, reprint, publicly transmit, distribute, publish, or use them for commercial purposes without authorization.</li>
                <li>Users shall grant the Company permission to use content posted by Users to the Service within the scope necessary for providing, maintaining, improving the Service, and developing new services.</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 9 (Usage Restrictions and Registration Deletion)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>The Company may delete posted data, restrict all or part of the Service use, or delete user registration without prior notice or demand if a User falls under any of the following:</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>When any provision of these Terms is violated</li>
                <li>When it is discovered that false facts exist in registered information</li>
                <li>When the credit card reported by the User as a payment method is suspended</li>
                <li>When there is non-performance of payment obligations such as fees</li>
                <li>When there is no response to communications from the Company for a certain period</li>
                <li>When the Service has not been used for a certain period since the last use</li>
                <li>When the Company otherwise determines that use of the Service is not appropriate</li>
              </ul>
              <p className="text-gray-700 mt-4">
                The Company shall not be liable for any damages incurred by Users due to actions taken by the Company based on this Article.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 10 (Prohibition of Circumvention and Direct Transactions)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Sellers and buyers shall not conduct direct transactions, negotiations, or communications using information about other Users, projects, or transactions obtained on APPEXIT without going through APPEXIT.</li>
                <li>If a transaction is completed without going through APPEXIT in violation of the previous paragraph, the User shall pay APPEXIT a penalty of the higher of either three times the fees that would have been generated or 3 million yen.</li>
                <li>The Company may immediately suspend accounts, permanently ban users, and take legal action (including damage claims and lawsuits) against violators.</li>
                <li>This Article shall remain in effect for two years from the date of commencement of transaction negotiations.</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 11 (Withdrawal)</h2>
              <p className="text-gray-700 mb-4">
                Users may withdraw from the Service through the withdrawal procedures prescribed by the Company.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 12 (Disclaimer of Warranties and Limitation of Liability)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>The Company does not guarantee, either expressly or implicitly, that the Service is free from defects in fact or law (including defects related to safety, reliability, accuracy, completeness, effectiveness, fitness for a particular purpose, security, errors or bugs, and infringement of rights).</li>
                <li>The Company shall not be liable for any damages incurred by Users arising from the Service. However, this disclaimer shall not apply if the contract between the Company and Users regarding the Service (including these Terms) constitutes a consumer contract as defined by the Consumer Contract Act.</li>
                <li>Even in cases specified in the proviso of the previous paragraph, the Company shall not be liable for damages arising from special circumstances (including cases where the Company or Users foresaw or could have foreseen the occurrence of damages) among damages incurred by Users due to default or tort caused by the Company's negligence (excluding gross negligence).</li>
              </ol>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 13 (Changes to Service Content)</h2>
              <p className="text-gray-700 mb-4">
                The Company may change the content of the Service or discontinue the provision of the Service without notifying Users, and shall not be liable for any damages incurred by Users as a result.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 14 (Changes to Terms of Service)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>The Company may change these Terms without individual consent from Users in the following cases:</li>
              </ol>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-8 mt-2">
                <li>When the change to these Terms conforms to the general interests of Users</li>
                <li>When the change to these Terms does not contradict the purpose of the Service usage contract and is reasonable in light of the necessity of the change, the appropriateness of the content after the change, and other circumstances related to the change</li>
              </ul>
              <p className="text-gray-700 mt-4">
                The Company shall notify Users in advance of the change to these Terms pursuant to the previous paragraph, the content of these Terms after the change, and the effective date thereof.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 15 (Handling of Personal Information)</h2>
              <p className="text-gray-700 mb-4">
                The Company shall appropriately handle personal information obtained through the use of the Service in accordance with the Company's "Privacy Policy."
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 16 (Notifications and Communications)</h2>
              <p className="text-gray-700 mb-4">
                Notifications or communications between Users and the Company shall be made by the method prescribed by the Company. Unless the Company receives notification of changes according to the format separately prescribed by the Company from Users, the Company shall deem the currently registered contact information as valid and shall send notifications or communications to such contact information, which shall be deemed to have reached Users at the time of transmission.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 17 (Prohibition of Transfer of Rights and Obligations)</h2>
              <p className="text-gray-700 mb-4">
                Users may not transfer their position under the usage contract or rights or obligations under these Terms to third parties or use them as security without prior written consent from the Company.
              </p>

              <h2 className="text-xl font-semibold mt-8 mb-4">Article 18 (Governing Law and Jurisdiction)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
                <li>Japanese law shall be the governing law for the interpretation of these Terms.</li>
                <li>In the event of a dispute arising in connection with the Service, the court having jurisdiction over the location of the Company's head office shall be the exclusive agreed jurisdiction.</li>
              </ol>

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
