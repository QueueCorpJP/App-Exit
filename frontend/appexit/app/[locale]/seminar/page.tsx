import Link from 'next/link'
import { seminarStructuredData, seminarFAQ, seminarService } from './metadata'
import { loadPageDictionary } from '@/lib/i18n-utils';
import type { Locale } from '@/i18n/config';

export default async function SeminarPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const dict = await loadPageDictionary(locale, 'seminar');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seminarStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seminarFAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seminarService) }}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{dict.title}</h1>
            <p className="text-xl text-gray-600">
              {dict.subtitle}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Online Seminar */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{dict.onlineSeminar.title}</h2>
                  <p className="text-sm text-gray-500">{dict.onlineSeminar.badge}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.onlineSeminar.recommendedFor.title}</h3>
                  <ul className="space-y-2 text-gray-700">
                    {dict.onlineSeminar.recommendedFor.items.map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.onlineSeminar.eventInfo.title}</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">{dict.onlineSeminar.eventInfo.schedule}</span>{dict.onlineSeminar.eventInfo.scheduleValue}</p>
                    <p><span className="font-medium">{dict.onlineSeminar.eventInfo.format}</span>{dict.onlineSeminar.eventInfo.formatValue}</p>
                    <p><span className="font-medium">{dict.onlineSeminar.eventInfo.fee}</span>{dict.onlineSeminar.eventInfo.feeValue}</p>
                    <p><span className="font-medium">{dict.onlineSeminar.eventInfo.capacity}</span>{dict.onlineSeminar.eventInfo.capacityValue}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.onlineSeminar.content.title}</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    {dict.onlineSeminar.content.items.map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/contact?type=seminar"
                  className="block w-full py-3 px-6 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {dict.onlineSeminar.bookButton}
                </Link>
              </div>
            </div>

            {/* Individual Consultation */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{dict.individualConsultation.title}</h2>
                  <p className="text-sm text-gray-500">{dict.individualConsultation.badge}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.individualConsultation.recommendedFor.title}</h3>
                  <ul className="space-y-2 text-gray-700">
                    {dict.individualConsultation.recommendedFor.items.map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.individualConsultation.consultationDetails.title}</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">{dict.individualConsultation.consultationDetails.hours}</span>{dict.individualConsultation.consultationDetails.hoursValue}</p>
                    <p><span className="font-medium">{dict.individualConsultation.consultationDetails.format}</span>{dict.individualConsultation.consultationDetails.formatValue}</p>
                    <p><span className="font-medium">{dict.individualConsultation.consultationDetails.fee}</span>{dict.individualConsultation.consultationDetails.feeValue}</p>
                    <p><span className="font-medium">{dict.individualConsultation.consultationDetails.confidentiality}</span>{dict.individualConsultation.consultationDetails.confidentialityValue}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{dict.individualConsultation.topics.title}</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    {dict.individualConsultation.topics.items.map((item: string, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/contact?type=consultation"
                  className="block w-full py-3 px-6 bg-green-600 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  {dict.individualConsultation.bookButton}
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{dict.faq.title}</h2>
            <div className="space-y-6">
              {dict.faq.items.map((faqItem: any, index: number) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 mb-2">{faqItem.question}</h3>
                  <p className="text-gray-700 ml-4">
                    {faqItem.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Application Flow */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{dict.applicationFlow.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dict.applicationFlow.steps.map((step: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">{step.number}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">{dict.cta.title}</h2>
            <p className="text-lg mb-6 text-blue-100">
              {dict.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact?type=seminar"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                {dict.cta.seminarButton}
              </Link>
              <Link
                href="/contact?type=consultation"
                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-400 transition-colors"
              >
                {dict.cta.consultationButton}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
