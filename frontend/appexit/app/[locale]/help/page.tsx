import Link from 'next/link'
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function HelpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await loadPageDictionary(locale, 'help');
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-extrabold mb-6 text-center" style={{ color: '#323232' }}>{dict.title}</h1>
          <p className="text-lg" style={{ color: '#323232' }}>
            {dict.description}
          </p>
        </div>

        <div className="space-y-20">
          {/* Getting Started / はじめての方へ */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>{dict.sections.gettingStarted.title}</h2>
              <p className="text-sm" style={{ color: '#323232' }}>{dict.sections.gettingStarted.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dict.sections.gettingStarted.items.map((item: any, index: number) => (
                <Link key={index} href={item.href} className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <h3 className="font-bold mb-3" style={{ color: '#323232' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#323232' }}>{item.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Need Help / お困りのとき */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>{dict.sections.needHelp.title}</h2>
              <p className="text-sm" style={{ color: '#323232' }}>{dict.sections.needHelp.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dict.sections.needHelp.items.map((item: any, index: number) => (
                <Link key={index} href={item.href} className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <h3 className="font-bold mb-3" style={{ color: '#323232' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#323232' }}>{item.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Terms & Policies / 利用規約・ポリシー */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>{dict.sections.termsAndPolicies.title}</h2>
              <p className="text-sm" style={{ color: '#323232' }}>{dict.sections.termsAndPolicies.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dict.sections.termsAndPolicies.items.map((item: any, index: number) => (
                <Link key={index} href={item.href} className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <h3 className="font-bold mb-3" style={{ color: '#323232' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#323232' }}>{item.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Security & Safety / セキュリティ・安全管理 */}
          <section>
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3" style={{ color: '#323232' }}>{dict.sections.securityAndSafety.title}</h2>
              <p className="text-sm" style={{ color: '#323232' }}>{dict.sections.securityAndSafety.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dict.sections.securityAndSafety.items.map((item: any, index: number) => (
                <Link key={index} href={item.href} className="block border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors">
                  <h3 className="font-bold mb-3" style={{ color: '#323232' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: '#323232' }}>{item.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Emergency Contacts / 緊急時の連絡先 */}
          <section className="border-t border-gray-200 pt-12">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-6" style={{ color: '#323232' }}>{dict.sections.emergencyContacts.title}</h2>
              <div className="space-y-3">
                {dict.sections.emergencyContacts.contacts.map((contact: any, index: number) => (
                  <p key={index} style={{ color: '#323232' }}>
                    <span className="font-semibold">{contact.label}</span>
                    <a href={`mailto:${contact.email}`} className="hover:underline ml-2">{contact.email}</a>
                  </p>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
