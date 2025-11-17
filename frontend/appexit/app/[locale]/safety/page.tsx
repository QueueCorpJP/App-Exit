import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function SafetyPolicyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await loadPageDictionary(locale, 'safety');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-lg p-8" style={{ color: '#323232' }}>
          <h1 className="text-2xl font-bold mb-12 text-center">{dict.title}</h1>

          <div className="prose max-w-none">
            <p className="mb-8">
              {dict.introduction}
            </p>

            <div className="space-y-8">
              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.basicPolicy.title}</h2>
                <p className="mb-3 font-medium">
                  {dict.basicPolicy.intro}
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  {dict.basicPolicy.items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ol>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section1.title}</h2>
                <p className="mb-4">
                  {dict.section1.intro}
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section1.targetScope.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section1.targetScope.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section1.targetPersons.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section1.targetPersons.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section2.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.organizational.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section2.organizational.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section2.rolesAndResponsibilities.title}</h3>
                    <div className="space-y-3 ml-4">
                      <div>
                        <p className="font-medium">{dict.section2.rolesAndResponsibilities.cso.title}</p>
                        <p className="text-sm">
                          {dict.section2.rolesAndResponsibilities.cso.description}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{dict.section2.rolesAndResponsibilities.committee.title}</p>
                        <p className="text-sm">
                          {dict.section2.rolesAndResponsibilities.committee.description}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{dict.section2.rolesAndResponsibilities.departmentManager.title}</p>
                        <p className="text-sm">
                          {dict.section2.rolesAndResponsibilities.departmentManager.description}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{dict.section2.rolesAndResponsibilities.allEmployees.title}</p>
                        <p className="text-sm">
                          {dict.section2.rolesAndResponsibilities.allEmployees.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section3.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.verification.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.verification.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.monitoring.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.monitoring.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section3.escrow.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section3.escrow.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section4.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section4.prevention.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section4.prevention.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section4.prohibition.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section4.prohibition.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section4.reporting.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section4.reporting.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section5.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section5.personalInfoProtection.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section5.personalInfoProtection.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section5.informationHandling.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section5.informationHandling.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section6.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section6.systemSecurity.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section6.systemSecurity.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section6.availability.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section6.availability.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section6.monitoringSystem.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section6.monitoringSystem.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section7.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section7.emergencyDefinition.title}</h3>
                    <p className="mb-2">
                      {dict.section7.emergencyDefinition.intro}
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section7.emergencyDefinition.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section7.responseProcedures.title}</h3>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      {dict.section7.responseProcedures.items.map((item: any, index: number) => (
                        <li key={index}>
                          <span className="font-medium">{item.label}</span>
                          {item.description}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section7.communicationSystem.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section7.communicationSystem.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section8.title}</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section8.employeeEducation.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section8.employeeEducation.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section8.userAwareness.title}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {dict.section8.userAwareness.items.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section9.title}</h2>
                <p className="mb-3">
                  {dict.section9.intro}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  {dict.section9.items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section10.title}</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section10.regularReview.title}</h3>
                    <p>
                      {dict.section10.regularReview.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section10.riskAssessment.title}</h3>
                    <p>
                      {dict.section10.riskAssessment.description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{dict.section10.pdcaCycle.title}</h3>
                    <p>
                      {dict.section10.pdcaCycle.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section11.title}</h2>
                <p className="mb-4">
                  {dict.section11.intro}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  {dict.section11.items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="border-0 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">{dict.section12.title}</h2>
                <p className="mb-4">
                  {dict.section12.intro}
                </p>
                <div className="p-4 rounded">
                  <p className="font-semibold">{dict.section12.contact.company}</p>
                  <p>{dict.section12.contact.officer}</p>
                  <p>{dict.section12.contact.email}</p>
                  <p>{dict.section12.contact.emergency}</p>
                  <p>{dict.section12.contact.address}</p>
                </div>
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
