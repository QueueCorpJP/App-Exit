import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function CustomerHarassmentPolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await loadPageDictionary(locale, 'customerHarassment');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-extrabold mb-12 text-center">{dict.title}</h1>

          <div className="prose max-w-none">
            <p className="mb-8">
              {dict.introduction}
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section1.title}</h2>
                <p className="mb-4">
                  {dict.section1.content}
                </p>
                <div className="bg-blue-50 rounded p-4 mt-4">
                  <p className="font-medium mb-2">{dict.section1.stance.title}</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {dict.section1.stance.items.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section2.title}</h2>
                <p className="mb-4">
                  {dict.section2.intro}
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.violent.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.violent.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.mental.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.mental.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.excessive.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.excessive.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.obstruction.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.obstruction.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.sexual.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.sexual.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.categories.authority.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.categories.authority.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section3.title}</h2>
                <p className="mb-4">
                  {dict.section3.intro}
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.categories.warning.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.categories.warning.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.categories.restriction.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.categories.restriction.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.categories.legal.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.categories.legal.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section4.title}</h2>
                <p className="mb-3">
                  {dict.section4.intro}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {dict.section4.items.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4">
                  {dict.section4.note}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section5.title}</h2>
                <p className="mb-3">
                  {dict.section5.intro}
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section5.categories.education.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section5.categories.education.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section5.categories.support.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section5.categories.support.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section5.categories.environment.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section5.categories.environment.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section6.title}</h2>
                <p className="mb-3">
                  {dict.section6.intro}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {dict.section6.items.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section7.title}</h2>
                <p className="mb-3">
                  {dict.section7.intro}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {dict.section7.items.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section8.title}</h2>
                <p className="mb-4">
                  {dict.section8.intro}
                </p>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">{dict.section8.customerContact.title}</h3>
                    <p className="">
                      {dict.section8.customerContact.company}
                      <br />
                      {dict.section8.customerContact.email}
                      <br />
                      {dict.section8.customerContact.phone}
                      <br />
                      {dict.section8.customerContact.hours}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">{dict.section8.employeeContact.title}</h3>
                    <p className="">
                      {dict.section8.employeeContact.department}
                      <br />
                      {dict.section8.employeeContact.email}
                      <br />
                      {dict.section8.employeeContact.note}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">{dict.section9.title}</h2>
                <p className="">
                  {dict.section9.content}
                </p>
              </div>

              <div className="bg-amber-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.finally.title}</h2>
                <p className="">
                  {dict.finally.content}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200">
              <p className="text-sm">{dict.footer.established}</p>
              <p className="text-sm">{dict.footer.lastRevised}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
